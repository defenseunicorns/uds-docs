#!/bin/bash
set -e

TARGET_DIR="src/content/docs/"

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

# --- Step 1: Read product config and clone latest docs ---
# discover-versions.mjs reads products.json, discovers versions, and writes .versions JSON
# which contains sources, versions, and all metadata the rest of this script needs.
echo "Reading product config and discovering versions..."
node scripts/discover-versions.mjs

echo "Preparing target directory: $TARGET_DIR"
mkdir -p "$TARGET_DIR"

# Collect all non-root product contentDirs so the base rsync --delete doesn't wipe them.
# NOTE: This only protects product dirs — versioned dirs (e.g. v0-61/) are safe because
# they are created in Step 2 *after* the base rsync runs here. Do not reorder steps.
PRODUCT_EXCLUDES=()
if [[ -f .versions ]]; then
  while IFS= read -r dir; do
    [[ -n "$dir" ]] && PRODUCT_EXCLUDES+=(--exclude="$dir/")
  done < <(jq -r 'to_entries[] | select(.value.contentDir != "") | .value.contentDir' .versions)
fi

# Clone or copy a single content source into the target directory.
# Args: mode repo_full branch docs_path target
process_source() {
  local mode="$1" repo_full="$2" branch="$3" docs_path="$4" target="$5"
  local override_key="${repo_full##*/}"

  local rsync_args=(-rt --exclude='404.md')
  if [[ "$mode" == "base" ]]; then
    rsync_args+=(--delete "${PRODUCT_EXCLUDES[@]}")
  fi

  if [[ ${OVERRIDES[$override_key]+_} ]]; then
    local local_path="${OVERRIDES[$override_key]}"
    echo "Using local override for '$override_key': $local_path"
    if [[ ! -d "$local_path/$docs_path" ]]; then
      echo "Warning: override source '$local_path/$docs_path' not found; skipping."
      return
    fi
    rsync "${rsync_args[@]}" "$local_path/$docs_path/" "$target"
  else
    local temp_dir="./temp/${override_key}"
    clone_repo "https://github.com/${repo_full}" "$branch" "$temp_dir"
    echo "Cloned ${repo_full}@${branch}"
    if [[ ! -d "${temp_dir}/$docs_path" ]]; then
      echo "Warning: source '${temp_dir}/$docs_path' not found; skipping."
      return
    fi
    rsync "${rsync_args[@]}" "${temp_dir}/$docs_path/" "$target"
  fi
}

# Process content sources from .versions (populated from products.json source config).
# Sources are sorted globally: all base sources run before any overlay, regardless of product.
# This is safe because each product targets its own contentDir (no cross-product conflicts).
if [[ -f .versions ]]; then
  # Emit all sources as tab-separated lines: mode repo branch docsPath contentDir
  # Sorted so base sources come before overlay sources.
  while IFS=$'\t' read -r mode repo_full branch docs_path content_dir; do
    if [[ -n "$content_dir" ]]; then
      target="${TARGET_DIR}${content_dir}/"
    else
      target="$TARGET_DIR"
    fi
    process_source "$mode" "$repo_full" "$branch" "$docs_path" "$target"
  done < <(jq -r '
    [to_entries[] | .value as $v |
     ($v.sources // [])[] |
     [.mode, .repo, .branch, .docsPath, $v.contentDir]
    ] | sort_by(if .[0] == "base" then 0 else 1 end)[]
    | @tsv
  ' .versions)
fi

# Copy LikeC4 model if present in uds-core
uds_core_override="${OVERRIDES[uds-core]:-}"
if [[ -n "$uds_core_override" && -d "$uds_core_override/docs/.c4" ]]; then
  echo "Copying LikeC4 model from override"
  rm -rf "${TARGET_DIR}/.c4"
  mkdir -p "${TARGET_DIR}/.c4"
  cp -r "$uds_core_override/docs/.c4/." "${TARGET_DIR}/.c4/"
elif [[ -d "./temp/uds-core/docs/.c4" ]]; then
  echo "Copying LikeC4 model from uds-core"
  rm -rf "${TARGET_DIR}/.c4"
  mkdir -p "${TARGET_DIR}/.c4"
  cp -r "./temp/uds-core/docs/.c4/." "${TARGET_DIR}/.c4/"
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
rm -rf "$TARGET_DIR/dev"
rm -rf "$TARGET_DIR/adr"

# Remove README.md if present (not needed in docs site)
rm -f "$TARGET_DIR/README.md"

# Clean up temp folder
echo "Cleaning up temp directory"
rm -rf temp

echo "Documentation integration complete!"
