#!/bin/bash
set -e

TARGET_DIR="src/content/docs/"

# UDS Core is the base - copied first
# Other repos overlay on top without deleting uds-core files
repos=(
  "https://github.com/defenseunicorns/uds-core main ./temp/uds-core base"
  "https://github.com/defenseunicorns/uds-identity-config main ./temp/uds-identity-config overlay"
  # TODO: can reinclude this repo once we update the docs there
  # "https://github.com/defenseunicorns/uds-cli main ./temp/cli overlay"
  # "https://github.com/defenseunicorns-labs/uds-rke2-demo main ./temp/uds-rke-demo overlay"
)

mkdir -p temp

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

repo_key_from_url() {
  local url="$1"
  url="${url%/}"
  local base="${url##*/}"
  echo "${base%.git}"
}

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

# Copies a docs/ source directory into TARGET_DIR.
# mode "base" clears the target first; "overlay" preserves existing files.
copy_docs() {
  local src="$1"
  local mode="$2"
  if [[ "$mode" == "base" ]]; then
    rsync -rt --delete --exclude='404.md' "$src/" "$TARGET_DIR/"
  else
    rsync -rt "$src/" "$TARGET_DIR/"
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

# Process repositories in order
for repo_info in "${repos[@]}"; do
  IFS=' ' read -r -a repo <<< "$repo_info"
  repo_url="${repo[0]}"
  branch="${repo[1]}"
  target_dir="${repo[2]}"
  mode="${repo[3]:-overlay}" # 'base' or 'overlay'

  key="$(repo_key_from_url "$repo_url")"
  if [[ -z "$key" ]]; then
    key="${target_dir##*/}"
  fi

  if [[ ${OVERRIDES[$key]+_} ]]; then
    local_path="${OVERRIDES[$key]}"
    echo "Using local override for '$key': $local_path"
    if [[ ! -d "$local_path/docs" ]]; then
      echo "Warning: override source '$local_path/docs' not found; skipping."
      continue
    fi
    echo "Copying docs ($mode) from $local_path/docs/"
    copy_docs "$local_path/docs" "$mode"
    continue
  fi

  clone_repo "$repo_url" "$branch" "$target_dir"
  echo "Cloned ${repo_url}@${branch} into ${target_dir}"

  echo "Copying docs ($mode) from ${target_dir}/docs/"
  copy_docs "${target_dir}/docs" "$mode"
done

# Copy LikeC4 model if present in uds-core
uds_core_override="${OVERRIDES[uds-core]:-}"
if [[ -n "$uds_core_override" && -d "$uds_core_override/docs/.c4" ]]; then
  echo "Copying LikeC4 model from override"
  copy_c4 "$uds_core_override/docs/.c4"
elif [[ -d "./temp/uds-core/docs/.c4" ]]; then
  echo "Copying LikeC4 model from uds-core"
  copy_c4 "./temp/uds-core/docs/.c4"
fi

# --- Step 2: Clone archived versioned docs ---

# Remove any stale versioned directories from previous builds
find "$TARGET_DIR" -maxdepth 1 -type d -name 'v[0-9]*' -exec rm -rf {} + 2>/dev/null || true
# Also clean versioned dirs inside product subdirs (e.g. my-product/v1-2/)
for product_dir in "$TARGET_DIR"*/; do
  [[ -d "$product_dir" ]] || continue
  find "$product_dir" -maxdepth 1 -type d -name 'v[0-9]*' -exec rm -rf {} + 2>/dev/null || true
done

# Clone each archived version from .versions metadata
if [[ -f .versions ]]; then
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
fi

# --- Step 3: Cleanup ---

# Remove dev and adr directories if present (not for public docs site)
echo "Removing dev and adr directories"
rm -rf "$TARGET_DIR/dev" "$TARGET_DIR/adr"

# Remove README.md if present (not needed in docs site)
rm -f "$TARGET_DIR/README.md"

# Rename hyphenated subdirectories to Title Case so Starlight uses them as
# sidebar labels (e.g. "single-sign-on" -> "Single Sign-On").
# Acronyms are preserved (e.g. "uds" -> "UDS", "idam" -> "IdAM").
# "and" is converted to "&" (e.g. "identity-and-access" -> "Identity & Access").
# When "&" appears in a dir name, github-slugger strips it and leaves a double
# hyphen (e.g. "Identity & Access" -> URL slug "identity--access"). We track
# these renames and rewrite internal links in all markdown files to match.
# Top-level directories (depth 1) are skipped — those are referenced by name
# in astro.config.mjs autogenerate entries and must stay hyphenated.
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
done < <(find "$TARGET_DIR" -mindepth 2 -depth -type d -not -path '*/.c4*' -not -path '*/.images*')

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
