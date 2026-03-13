#!/bin/bash
set -e

TARGET_DIR="src/content/docs/"

# DOCS_OVERRIDES="uds-core=/abs/path;uds-identity-config=/abs/path2"
# Keys are repo names (e.g. "uds-core" from "defenseunicorns/uds-core").
# When set, the local path is used instead of cloning from GitHub.

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

# Copies a docs/ source directory into a target directory.
# mode "base" clears the target first; "overlay" preserves existing files.
# $3 = destination directory (defaults to TARGET_DIR)
copy_docs() {
  local src="$1"
  local mode="$2"
  local dest="${3:-$TARGET_DIR}"
  mkdir -p "$dest"
  if [[ "$mode" == "base" ]]; then
    rsync -rt --delete --force --exclude='404.md' "$src/" "$dest/"
  else
    rsync -rt "$src/" "$dest/"
  fi
}

# Copies a LikeC4 .c4 model directory into TARGET_DIR/.c4.
copy_c4() {
  local src="$1"
  rm -rf "${TARGET_DIR}/.c4"
  mkdir -p "${TARGET_DIR}/.c4"
  cp -r "$src/." "${TARGET_DIR}/.c4/"
}

echo "Preparing target directory: $TARGET_DIR"
mkdir -p "$TARGET_DIR"
mkdir -p temp

# Generate .versions metadata from GitHub releases
node scripts/discover-versions.mjs

# --- Step 1: Clone and copy docs from .versions ---
# Products and their sources are driven by src/products.json via scripts/discover-versions.mjs.
# To add or remove a product, edit products.json — no changes needed here.

if [[ ! -f .versions ]]; then
  echo "Error: .versions not found. Run 'node scripts/discover-versions.mjs' first."
  exit 1
fi

while IFS= read -r product_id; do
  contentDir=$(jq -r --arg id "$product_id" '.[$id].contentDir' .versions)
  dest_dir="${TARGET_DIR}${contentDir}"
  source_len=$(jq --arg id "$product_id" '.[$id].sources // [] | length' .versions)

  for (( si=0; si<source_len; si++ )); do
    repo_full=$(jq -r --arg id "$product_id" --argjson i "$si" '.[$id].sources[$i].repo' .versions)
    branch=$(jq -r --arg id "$product_id" --argjson i "$si" '.[$id].sources[$i].branch // "main"' .versions)
    docsPath=$(jq -r --arg id "$product_id" --argjson i "$si" '.[$id].sources[$i].docsPath // "docs"' .versions)
    mode=$(jq -r --arg id "$product_id" --argjson i "$si" '.[$id].sources[$i].mode // "overlay"' .versions)

    repo_name="${repo_full##*/}"
    temp_dir="./temp/${repo_name}"

    if [[ ${OVERRIDES[$repo_name]+_} ]]; then
      local_path="${OVERRIDES[$repo_name]}"
      echo "Using local override for '$repo_name': $local_path"
      if [[ ! -d "$local_path/${docsPath}" ]]; then
        echo "Warning: override source '$local_path/${docsPath}' not found; skipping."
        continue
      fi
      echo "Copying docs ($mode) from $local_path/${docsPath}/ to $dest_dir"
      copy_docs "$local_path/${docsPath}" "$mode" "$dest_dir"
    else
      clone_repo "https://github.com/${repo_full}" "$branch" "$temp_dir"
      echo "Cloned ${repo_full}@${branch} into ${temp_dir}"
      if [[ ! -d "${temp_dir}/${docsPath}" ]]; then
        echo "Warning: no ${docsPath}/ found in ${repo_full}; skipping."
        continue
      fi
      echo "Copying docs ($mode) from ${temp_dir}/${docsPath}/ to $dest_dir"
      copy_docs "${temp_dir}/${docsPath}" "$mode" "$dest_dir"
    fi
  done
done < <(jq -r 'keys[]' .versions)

# Copy LikeC4 model if present in any cloned temp dir (stays at TARGET_DIR root for the Vite plugin)
for temp_product_dir in ./temp/*/; do
  [[ -d "$temp_product_dir" ]] || continue
  repo_name="${temp_product_dir##./temp/}"
  repo_name="${repo_name%/}"
  if [[ ${OVERRIDES[$repo_name]+_} ]]; then
    c4_src="${OVERRIDES[$repo_name]}/docs/.c4"
  else
    c4_src="${temp_product_dir}docs/.c4"
  fi
  if [[ -d "$c4_src" ]]; then
    echo "Copying LikeC4 model from $c4_src"
    copy_c4 "$c4_src"
    break
  fi
done

# Rewrite root-relative internal links for each product to use their contentDir prefix.
# Upstream docs may reference sections with root-relative paths like /reference/, /overview/, etc.
# After placing content under /contentDir/, these must become /contentDir/reference/ etc.
DEFAULT_SECTIONS=(overview getting-started concepts how-to-guides reference operations)

while IFS= read -r product_id; do
  contentDir=$(jq -r --arg id "$product_id" '.[$id].contentDir' .versions)
  [[ -z "$contentDir" ]] && continue
  [[ ! -d "${TARGET_DIR}${contentDir}" ]] && continue

  echo "Rewriting root-relative links in ${contentDir} docs to /${contentDir}/ prefix..."
  sed_args=()
  for section in "${DEFAULT_SECTIONS[@]}"; do
    sed_args+=(-e "s|](/${section}/|](/${contentDir}/${section}/|g")
    sed_args+=(-e "s|href=\"/${section}/|href=\"/${contentDir}/${section}/|g")
  done
  while IFS= read -r file; do
    sed -i.bak "${sed_args[@]}" "$file" && rm -f "${file}.bak"
  done < <(find "${TARGET_DIR}${contentDir}" -maxdepth 5 -type f \( -name "*.md" -o -name "*.mdx" \) -not -path '*/v[0-9]*/*')
done < <(jq -r 'keys[]' .versions)

# Create per-product 404 pages. The root /404 page is associated with the first
# product's sidebar topic so the dropdown and sidebar render correctly on 404s.
# Each product also gets its own 404 page so the client-side swap script can
# fetch it and show the correct sidebar when a non-versioned URL 404s.
echo "Creating per-product 404 pages..."
while IFS= read -r product_id; do
  contentDir=$(jq -r --arg id "$product_id" '.[$id].contentDir' .versions)
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
done < <(jq -r 'keys[]' .versions)

# --- Step 2: Clone archived versioned docs ---

# Remove any stale versioned directories from previous builds
find "$TARGET_DIR" -maxdepth 1 -type d -name 'v[0-9]*' -exec rm -rf {} + 2>/dev/null || true
# Also clean versioned dirs inside product subdirs (e.g. my-product/v1-2/)
for product_dir in "$TARGET_DIR"*/; do
  [[ -d "$product_dir" ]] || continue
  find "$product_dir" -maxdepth 1 -type d -name 'v[0-9]*' -exec rm -rf {} + 2>/dev/null || true
done

# Clone each archived version from .versions metadata
for product_id in $(jq -r 'keys[]' .versions); do
  repo_full=$(jq -r --arg id "$product_id" '.[$id].versionRepo // empty' .versions)
  content_dir=$(jq -r --arg id "$product_id" '.[$id].contentDir' .versions)
  docs_path=$(jq -r --arg id "$product_id" '.[$id].versionDocsPath // "docs"' .versions)
  versions_csv=$(jq -r --arg id "$product_id" '.[$id].versions // [] | join(",")' .versions)

  [[ -z "$versions_csv" ]] && continue
  [[ -z "$repo_full" ]] && continue

  override_key="${repo_full##*/}"

  echo "Cloning versioned docs for $product_id from $repo_full..."

  IFS=',' read -ra vers <<< "$versions_csv"
  for ver in "${vers[@]}"; do
    ver="${ver// /}"
    [[ -z "$ver" ]] && continue

    # Build version slug: v0.61.0 → v0-61 (drop patch, dots → hyphens for Astro compat)
    ver_slug="$(echo "$ver" | sed 's/\.[^.]*$//' | tr '.' '-')"

    # Build target path: Core → src/content/docs/v0-61, My Product → src/content/docs/my-product/v1-2
    if [[ -n "$content_dir" ]]; then
      version_dir="${TARGET_DIR}${content_dir}/${ver_slug}"
    else
      version_dir="${TARGET_DIR}${ver_slug}"
    fi

    temp_ver_dir="./temp/${product_id}-${ver}"
    local_override="${OVERRIDES[$override_key]:-}"

    if [[ -n "$local_override" ]]; then
      echo "Using local override for versioned ${product_id} (${ver})"
      mkdir -p "$version_dir"
      rsync -rt --delete --exclude='404.md' "$local_override/${docs_path}/" "$version_dir/"
    else
      repo_url="https://github.com/${repo_full}"
      if ! clone_repo "$repo_url" "$ver" "$temp_ver_dir"; then
        echo "Warning: could not clone ${product_id} at tag '${ver}'; skipping."
        continue
      fi
      if [[ ! -d "${temp_ver_dir}/${docs_path}" ]]; then
        echo "Warning: no ${docs_path}/ found for ${product_id} ${ver}; skipping."
        continue
      fi
      mkdir -p "$version_dir"
      rsync -rt --delete --exclude='404.md' "${temp_ver_dir}/${docs_path}/" "${version_dir}/"
    fi

    # Remove non-public directories
    rm -rf "${version_dir}/dev" "${version_dir}/adr"
    rm -f "${version_dir}/README.md"

    # Create a landing page at the version root
    cat > "${version_dir}/index.md" << EOF
---
title: "${product_id^} ${ver}"
pagefind: false
sidebar:
  hidden: true
---

This is documentation for **${product_id^} ${ver}**.

Use the version picker in the header to navigate between versions, or browse the sidebar to find content.
EOF

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
done

# --- Step 3: Cleanup ---

# Remove dev, adr, and README for all products (not for public docs site)
echo "Removing dev/adr directories and READMEs"
while IFS= read -r product_id; do
  contentDir=$(jq -r --arg id "$product_id" '.[$id].contentDir' .versions)
  product_dir="${TARGET_DIR}${contentDir}"
  rm -rf "${product_dir}/dev" "${product_dir}/adr"
  rm -f "${product_dir}/README.md"
done < <(jq -r 'keys[]' .versions)

# Remove the ecosystem overview doc — its content lives on the root index.astro page instead
rm -f "${TARGET_DIR}core/overview/overview.mdx"

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
      if [[ "$new_base" == *"&"* ]]; then
        rel_old="${dir#$TARGET_DIR}"
        SLUG_RENAMES+=("$rel_old:${rel_old//-and-/--}")
      fi
    fi
  fi
done < <(find "$TARGET_DIR" -mindepth 3 -depth -type d -not -path '*/.c4*' -not -path '*/.images*' -not -path '*/v[0-9]*')

# Rewrite internal links in all markdown files to use the updated slugs.
if [[ ${#SLUG_RENAMES[@]} -gt 0 ]]; then
  echo "Updating internal links for renamed directories..."
  sed_args=()
  for entry in "${SLUG_RENAMES[@]}"; do
    sed_args+=(-e "s|/${entry%%:*}/|/${entry#*:}/|g")
  done
  while IFS= read -r file; do
    sed -i.bak "${sed_args[@]}" "$file" && rm -f "${file}.bak"
  done < <(find "$TARGET_DIR" -type f \( -name "*.md" -o -name "*.mdx" \))
fi

# Bust Astro's content cache so it rescans renamed directories on next run.
# The data store caches entries by digest and reuses old file paths on cache
# hits, so we must clear it along with the derived content-modules.mjs.
rm -f .astro/content-modules.mjs .astro/data-store.json

# Clean up temp folder
echo "Cleaning up temp directory"
rm -rf temp

echo "Documentation integration complete!"
