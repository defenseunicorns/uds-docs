#!/usr/bin/env bash
set -e

TARGET_DIR="src/content/docs/"
CONFIG_DIR=".product-configs"

# DOCS_OVERRIDES="uds-core=/abs/path;uds-cli=/abs/path2"
# Keys are repo names (e.g. "uds-core" from "defenseunicorns/uds-core").
# When set, the local path is used instead of cloning from GitHub.
# Version-specific overrides use repo-name@tag as the key:
#   DOCS_OVERRIDES="uds-core=/path/to/latest;uds-core@v0.62.0=/path/to/old-version"
# The version-specific key is checked first; falls back to the repo-level key.

declare -A OVERRIDES
if [[ -n "${DOCS_OVERRIDES:-}" ]]; then
  IFS=';' read -ra pairs <<< "$DOCS_OVERRIDES"
  for p in "${pairs[@]}"; do
    key="${p%%=*}"
    val="${p#*=}"
    [[ -n "$key" && -n "$val" ]] && OVERRIDES["$key"]="$val"
  done
fi

clone_repo() {
  local repo_url="$1"
  local branch="$2"
  local target_dir="$3"

  if [ -d "$target_dir" ]; then
    echo "Removing existing cloned dir: $target_dir"
    rm -rf "$target_dir"
  fi

  git clone --branch "$branch" --depth 1 --single-branch "$repo_url" "$target_dir"
}

# Copies a LikeC4 .c4 model directory into TARGET_DIR/.c4.
copy_c4() {
  local src="$1"
  rm -rf "${TARGET_DIR}/.c4"
  mkdir -p "${TARGET_DIR}/.c4"
  cp -r "$src/." "${TARGET_DIR}/.c4/"
}

# Read upstream docs.config.json and write to .product-configs/.
# Args: $1=source_dir (containing docs.config.json), $2=repo, $3=config_filename
write_product_config() {
  local source_dir="$1"
  local repo="$2"
  local config_file="$3"
  local config_path="${source_dir}/docs.config.json"

  if [[ -f "$config_path" ]]; then
    # Merge repo into the upstream config
    jq --arg repo "$repo" '. + {repo: $repo}' "$config_path" > "${CONFIG_DIR}/${config_file}"
    return 0
  else
    return 1
  fi
}

# Extract contentDir from a product config file
get_content_dir() {
  jq -r '.contentDir' "${CONFIG_DIR}/$1"
}

# Remove directories not listed in sidebarOrder from a target directory.
# Only directories in sidebarOrder should be on disk — anything else causes Starlight
# to find orphaned pages with no sidebar topic. Keeps dot-dirs (.c4, .images) and version dirs.
# Args: $1=target_dir, $2=config_file_path, $3=label_for_logging
cleanup_unlisted_dirs() {
  local target="$1"
  local config="$2"
  local label="$3"
  [[ -f "$config" ]] || return
  mapfile -t allowed_dirs < <(jq -r '(.sidebarOrder // [])[] | if type == "string" then . else .dir end' "$config")
  for dir in "$target"/*/; do
    [[ -d "$dir" ]] || continue
    local dir_name
    dir_name=$(basename "$dir")
    [[ "$dir_name" == .* ]] && continue
    # Version dir pattern — must match VERSION_SLUG_PATTERN in src/productUtils.ts
    [[ "$dir_name" =~ ^v[0-9]+-[0-9]+$ ]] && continue
    local found=false
    for allowed in "${allowed_dirs[@]}"; do
      [[ "$dir_name" == "$allowed" ]] && found=true && break
    done
    if [[ "$found" == false ]]; then
      echo "  Removing unlisted directory: ${label}/${dir_name}"
      rm -rf "$dir"
    fi
  done
}

# Print a formatted error about a missing docs.config.json and exit.
# Args: $1=location description (e.g. "local override for 'uds-core'" or "defenseunicorns/uds-core@main")
missing_config_error() {
  echo ""
  echo -e "\033[1;31mERROR: docs/docs.config.json not found in ${1}."
  echo ""
  echo "  Each product repo must have a docs/docs.config.json file that defines"
  echo "  the product's id, label, contentDir, and sidebarOrder."
  echo ""
  echo -e "  See CONTRIBUTING.md → 'Upstream config file' for the schema and an example.\033[0m"
  echo ""
  exit 1
}

echo "Preparing target directory: $TARGET_DIR"
mkdir -p "$TARGET_DIR"
rm -rf "$CONFIG_DIR" && mkdir -p "$CONFIG_DIR"
rm -rf temp && mkdir -p temp

# Generate .versions metadata from GitHub releases
node scripts/discover-versions.mjs || {
  echo -e "\033[1;31mERROR: discover-versions.mjs failed. Cannot proceed without .versions.\033[0m"
  exit 1
}

# --- Step 1: Clone and copy latest docs ---

if [[ ! -f .versions ]]; then
  echo -e "\033[1;31mERROR: .versions not found after running discover-versions.mjs.\033[0m"
  exit 1
fi

while IFS= read -r repo; do
  branch=$(jq -r --arg r "$repo" '.[$r].branch // "main"' .versions)
  repo_name="${repo##*/}"
  temp_dir="./temp/${repo_name}"
  docs_source=""

  if [[ ${OVERRIDES[$repo_name]+_} ]]; then
    local_path="${OVERRIDES[$repo_name]}"
    echo "Using local override for '$repo_name': $local_path"
    if [[ ! -d "$local_path/docs" ]]; then
      echo "Warning: override source '$local_path/docs' not found; skipping."
      continue
    fi
    docs_source="$local_path/docs"
    if ! write_product_config "$local_path/docs" "$repo" "${repo_name}.json"; then
      missing_config_error "local override for '${repo_name}'"
    fi
  else
    clone_repo "https://github.com/${repo}" "$branch" "$temp_dir"
    echo "Cloned ${repo}@${branch} into ${temp_dir}"
    if [[ ! -d "${temp_dir}/docs" ]]; then
      echo "Warning: no docs/ found in ${repo}; skipping."
      continue
    fi
    docs_source="${temp_dir}/docs"
    if ! write_product_config "${temp_dir}/docs" "$repo" "${repo_name}.json"; then
      missing_config_error "${repo}@${branch}"
    fi
  fi

  contentDir=$(get_content_dir "${repo_name}.json")
  if [[ -z "$contentDir" || "$contentDir" == "null" ]]; then
    echo -e "\033[1;31mERROR: contentDir is missing or empty in docs.config.json for ${repo}.\033[0m"
    exit 1
  fi
  dest_dir="${TARGET_DIR}${contentDir}"

  echo "Copying docs from ${docs_source}/ to ${dest_dir}"
  mkdir -p "$dest_dir"
  rsync -rtL --delete --exclude='404.md' --exclude='docs.config.json' "$docs_source/" "$dest_dir/"

  cleanup_unlisted_dirs "$dest_dir" "${CONFIG_DIR}/${repo_name}.json" "$contentDir"

  # Copy LikeC4 model if present (stays at TARGET_DIR root for the Vite plugin)
  if [[ -d "${docs_source}/.c4" ]]; then
    echo "Copying LikeC4 model from ${docs_source}/.c4"
    copy_c4 "${docs_source}/.c4"
  fi
done < <(jq -r 'keys[]' .versions)

# --- Step 2: Create per-product 404 pages ---
echo "Creating per-product 404 pages..."
for config_file in "${CONFIG_DIR}"/*.json; do
  [[ -f "$config_file" ]] || continue
  [[ "$config_file" =~ \.v[0-9]+-[0-9]+\.json$ ]] && continue

  contentDir=$(jq -r '.contentDir' "$config_file")
  [[ -z "$contentDir" ]] && continue
  [[ ! -d "${TARGET_DIR}${contentDir}" ]] && continue

  cat > "${TARGET_DIR}${contentDir}/404.md" << 'MDEOF'
---
title: Page Not Found
template: doc
editUrl: false
lastUpdated: false
pagefind: false
sidebar:
  hidden: true
---

The page you're looking for doesn't exist or may have moved.

Use the sidebar to navigate, or return to the product home.
MDEOF
done

# --- Step 3: Clone archived versioned docs ---

# Remove any stale versioned directories from previous builds.
# Version dir pattern must match VERSION_SLUG_PATTERN in src/productUtils.ts.
find "$TARGET_DIR" -maxdepth 1 -type d -name 'v[0-9]*-[0-9]*' -exec rm -rf {} + 2>/dev/null || true
# Also clean versioned dirs inside product subdirs (e.g. core/v0-61/)
for product_dir in "$TARGET_DIR"*/; do
  [[ -d "$product_dir" ]] || continue
  find "$product_dir" -maxdepth 1 -type d -name 'v[0-9]*-[0-9]*' -exec rm -rf {} + 2>/dev/null || true
done

# Clone each archived version from .versions metadata
while IFS= read -r repo; do
  versions_csv=$(jq -r --arg r "$repo" '.[$r].versions // [] | join(",")' .versions)
  [[ -z "$versions_csv" ]] && continue

  repo_name="${repo##*/}"

  # We need contentDir from the latest config to know where to put versioned docs
  latest_config="${CONFIG_DIR}/${repo_name}.json"
  [[ ! -f "$latest_config" ]] && continue
  content_dir=$(jq -r '.contentDir' "$latest_config")
  product_id=$(jq -r '.id' "$latest_config")

  override_key="$repo_name"

  echo "Cloning versioned docs for ${product_id} from ${repo}..."

  IFS=',' read -ra vers <<< "$versions_csv"
  for ver in "${vers[@]}"; do
    ver="${ver// /}"
    [[ -z "$ver" ]] && continue

    # Build version slug: v0.61.0 → v0-61 (drop patch, dots → hyphens for Astro compat)
    ver_slug="$(echo "$ver" | sed 's/\.[^.]*$//' | tr '.' '-')"

    # Build target path: Core → src/content/docs/core/v0-61
    if [[ -n "$content_dir" ]]; then
      version_dir="${TARGET_DIR}${content_dir}/${ver_slug}"
    else
      version_dir="${TARGET_DIR}${ver_slug}"
    fi

    temp_ver_dir="./temp/${repo_name}-${ver}"
    # Check for version-specific override (repo-name@tag); no fallback to repo-level key
    local_override="${OVERRIDES[${override_key}@${ver}]:-}"
    ver_docs_source=""

    if [[ -n "$local_override" ]]; then
      echo "Using local override for versioned ${product_id} (${ver}): $local_override"
      ver_docs_source="$local_override/docs"
    else
      repo_url="https://github.com/${repo}"
      if ! clone_repo "$repo_url" "$ver" "$temp_ver_dir"; then
        echo "Warning: could not clone ${product_id} at tag '${ver}'; skipping."
        continue
      fi
      if [[ ! -d "${temp_ver_dir}/docs" ]]; then
        echo "Warning: no docs/ found for ${product_id} ${ver}; skipping."
        continue
      fi
      ver_docs_source="${temp_ver_dir}/docs"
    fi
    # Write version-specific product config — skip versions without docs.config.json
    if ! write_product_config "$ver_docs_source" "$repo" "${repo_name}.${ver_slug}.json"; then
      echo ""
      echo -e "\033[1;33mWARNING: docs/docs.config.json not found in ${repo}@${ver}."
      echo "  Skipping archived version ${ver}."
      echo -e "  To include this version, backport docs/docs.config.json to the ${ver} tag.\033[0m"
      echo ""
      continue
    fi

    mkdir -p "$version_dir"
    rsync -rtL --safe-links --delete --exclude='404.md' --exclude='docs.config.json' "$ver_docs_source/" "${version_dir}/"

    # Remove directories not in this version's sidebarOrder
    cleanup_unlisted_dirs "$version_dir" "${CONFIG_DIR}/${repo_name}.${ver_slug}.json" "${content_dir}/${ver_slug}"

    # Remove non-public directories
    rm -rf "${version_dir}/dev" "${version_dir}/adr"
    rm -f "${version_dir}/README.md"

    # Create a 404 page for this version
    cat > "${version_dir}/404.md" << 'MDEOF'
---
title: Page Not Found
template: doc
editUrl: false
lastUpdated: false
pagefind: false
sidebar:
  hidden: true
---

The page you're looking for doesn't exist in this version.

Use the sidebar to navigate, or use the **Version** selector to switch to a different version.
MDEOF

    echo "Versioned docs for ${product_id} ${ver} written to ${version_dir}"
  done
done < <(jq -r 'keys[]' .versions)

# --- Step 4: Cleanup ---

# Remove README files from product roots (not for public docs site).
# Unlisted directories (dev, adr, etc.) are already removed by cleanup_unlisted_dirs.
for config_file in "${CONFIG_DIR}"/*.json; do
  [[ -f "$config_file" ]] || continue
  [[ "$config_file" =~ \.v[0-9]+-[0-9]+\.json$ ]] && continue
  contentDir=$(jq -r '.contentDir' "$config_file")
  rm -f "${TARGET_DIR}${contentDir}/README.md"
done

# Rename hyphenated subdirectories to Title Case so Starlight uses them as
# sidebar labels (e.g. "single-sign-on" -> "Single Sign-On").
# Acronyms are preserved (e.g. "uds" -> "UDS", "idam" -> "IdAM").
# "and" is converted to "&" (e.g. "identity-and-access" -> "Identity & Access").
# When "&" appears in a dir name, github-slugger strips it and leaves a double
# hyphen (e.g. "Identity & Access" -> URL slug "identity--access"). We track
# these renames and rewrite internal links in all markdown files to match.
# Depth-1 (product dirs, e.g. "core") and depth-2 (section dirs, e.g. "core/getting-started",
# "core/how-to-guides") are skipped — these are referenced by name in astro.config.mjs
# autogenerate entries and must stay hyphenated for the sidebar to work.
# Only depth-3+ subdirs (e.g. "core/getting-started/single-sign-on") are renamed.
# Processed deepest-first so nested renames don't invalidate parent paths.
echo "Renaming hyphenated directories to Title Case..."
SLUG_RENAMES=()
while IFS= read -r dir; do
  base=$(basename "$dir")
  if [[ "$base" =~ ^[a-z][a-z0-9]*(-[a-z0-9]+)+$ ]]; then
    # Title-case with special-case handling for acronyms and compound terms.
    # Add new acronyms here when upstream repos introduce directory names that
    # need non-standard casing (Starlight uses the directory name as the sidebar label).
    new_base=$(echo "$base" | sed -E 's/-/ /g' | awk '{
      if (tolower($0) == "single sign on") {
        print "Single Sign-On"
        next
      }
      for (i = 1; i <= NF; i++) {
        if      (tolower($i) == "uds")  $i = "UDS";
        else if (tolower($i) == "idam") $i = "IdAM";
        else if (tolower($i) == "crds") $i = "CRDs";
        else if (tolower($i) == "and")  $i = "&";
        else $i = toupper(substr($i,1,1)) substr($i,2)
      }
      print
    }')
    new_path="$(dirname "$dir")/$new_base"
    if [[ ! -e "$new_path" ]]; then
      echo "  $base -> $new_base"
      mv "$dir" "$new_path"
      # Track dirs renamed to contain '&': github-slugger strips '&' and
      # leaves surrounding spaces as hyphens, producing a double hyphen.
      # "-and-" in the old slug becomes "--" in the URL slug.
      # Use section-relative paths (strip contentDir) because the remark-link-rewrite
      # plugin adds the product prefix at render time — raw files have bare section paths.
      if [[ "$new_base" == *"&"* ]]; then
        rel_old="${dir#$TARGET_DIR}"
        section_old="${rel_old#*/}"
        SLUG_RENAMES+=("$section_old:${section_old//-and-/--}")
      fi
    fi
  fi
done < <(find "$TARGET_DIR" -depth -mindepth 3 -type d -not -path '*/.c4*' -not -path '*/.images*' -not -path '*/v[0-9]*-[0-9]*/*')

# Rewrite internal links in all markdown files to use the updated slugs.
if [[ ${#SLUG_RENAMES[@]} -gt 0 ]]; then
  echo "Updating internal links for renamed directories..."
  sed_args=()
  for entry in "${SLUG_RENAMES[@]}"; do
    sed_args+=(-e "s|/${entry%%:*}/|/${entry#*:}/|g")
  done
  while IFS= read -r file; do
    sed -i.bak "${sed_args[@]}" "$file" && rm -f "${file}.bak"
  done < <(find "$TARGET_DIR" -type f \( -name "*.md" -o -name "*.mdx" \) -not -path '*/v[0-9]*-[0-9]*/*')
fi

# Bust Astro's content cache so it rescans renamed directories on next run.
# The data store caches entries by digest and reuses old file paths on cache
# hits, so we must clear it along with the derived content-modules.mjs.
rm -f .astro/content-modules.mjs .astro/data-store.json

# Clean up temp folder
echo "Cleaning up temp directory"
rm -rf temp

echo "Documentation integration complete!"
