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

# DOCS_OVERRIDES="uds-core=/abs/path;uds-cli=/abs/path2"

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
  # strip trailing slashes, then take the last segment and drop .git
  url="${url%/}"
  local base="${url##*/}"
  echo "${base%.git}"
}

clone_repo() {
    repo_url="$1"
    branch="$2"
    target_dir="$3"

    # Remove existing cloned directory if it exists
    if [ -d "$target_dir" ]; then
        echo "Removing existing cloned dir: $target_dir"
        rm -rf "$target_dir"
    fi

    # Clone the repository with specific branch/tag
    git clone --branch "$branch" --depth 1 --single-branch "$repo_url" "$target_dir"
}

# Clean target directory for fresh start (but preserve any manually created structure during transition)
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
  # Fallback if URL produced an empty key
  if [[ -z "$key" ]]; then
    key="${target_dir##*/}"
  fi

  # Local override path
  if [[ ${OVERRIDES[$key]+_} ]]; then
    local_path="${OVERRIDES[$key]}"
    echo "Using local override for '$key': $local_path"

    if [[ ! -d "$local_path/docs" ]]; then
      echo "Warning: override source '$local_path/docs' not found; skipping."
      continue
    fi

    # Copy from docs/ directory in repo to target
    if [[ "$mode" == "base" ]]; then
      echo "Copying base docs from $local_path/docs/ to $TARGET_DIR"
      # For base, we can be more aggressive about clearing
      rsync -rt --delete --exclude='404.md' "$local_path/docs/" "$TARGET_DIR/"
    else
      echo "Overlaying docs from $local_path/docs/ onto $TARGET_DIR"
      # For overlay, preserve existing files (no --delete)
      rsync -rt "$local_path/docs/" "$TARGET_DIR/"
    fi
    continue
  fi

  # Default: clone and copy
  clone_repo "$repo_url" "$branch" "$target_dir"
  echo "Cloned ${repo_url}@${branch} into ${target_dir}"

  if [[ ! -d "${target_dir}/docs" ]]; then
    echo "Warning: source '${target_dir}/docs' not found; skipping."
    continue
  fi

  # Copy from docs/ directory in repo to target
  if [[ "$mode" == "base" ]]; then
    echo "Copying base docs from ${target_dir}/docs/ to $TARGET_DIR"
    # For base (uds-core), use --delete to ensure clean slate
    rsync -rt --delete --exclude='404.md' "${target_dir}/docs/" "$TARGET_DIR/"
  else
    echo "Overlaying docs from ${target_dir}/docs/ onto $TARGET_DIR"
    # For overlay repos, preserve existing files (no --delete)
    rsync -rt "${target_dir}/docs/" "$TARGET_DIR/"
  fi
done

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

# --- Per-product version discovery & cloning ---
# discover-versions.mjs reads products.ts, queries GitHub API, writes .versions JSON.
echo "Discovering versions..."
node scripts/discover-versions.mjs

# .versions is a JSON object keyed by product id, e.g.:
# { "core": { "versions": ["v0.61.1", ...], "repo": "...", "contentDir": "", "docsPath": "docs" } }

# Remove any stale versioned directories from previous builds
find "$TARGET_DIR" -maxdepth 1 -type d -name 'v[0-9]*' -exec rm -rf {} + 2>/dev/null || true
# Also clean versioned dirs inside product subdirs (e.g. fleet/v1-2/)
for product_dir in "$TARGET_DIR"*/; do
  [[ -d "$product_dir" ]] || continue
  find "$product_dir" -maxdepth 1 -type d -name 'v[0-9]*' -exec rm -rf {} + 2>/dev/null || true
done

# Read product versioning config from .versions JSON and clone each.
# .versions now contains all metadata (repo, contentDir, docsPath, versions) per product,
# so we don't need to parse products.ts from bash at all.
if [[ -f .versions ]]; then
  for product_id in $(jq -r 'keys[]' .versions); do
    repo_full=$(jq -r --arg id "$product_id" '.[$id].repo' .versions)
    content_dir=$(jq -r --arg id "$product_id" '.[$id].contentDir' .versions)
    docs_path=$(jq -r --arg id "$product_id" '.[$id].docsPath' .versions)
    versions_csv=$(jq -r --arg id "$product_id" '.[$id].versions | join(",")' .versions)

    [[ -z "$versions_csv" || "$versions_csv" == "null" ]] && continue
    [[ -z "$repo_full" || "$repo_full" == "null" ]] && continue

    # Override key is the repo name (e.g. "uds-core" from "defenseunicorns/uds-core")
    override_key="${repo_full##*/}"

    echo "Cloning versioned docs for $product_id from $repo_full..."

    IFS=',' read -ra vers <<< "$versions_csv"
    for ver in "${vers[@]}"; do
      ver="${ver// /}"
      [[ -z "$ver" ]] && continue

      # Build version slug: v0.61.0 → v0-61 (drop patch, dots → hyphens for Astro compat)
      ver_slug="$(echo "$ver" | sed 's/\.[^.]*$//' | tr '.' '-')"

      # Build target path: Core → src/content/docs/v0-61, Fleet → src/content/docs/fleet/v1-2
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
        if ! clone_repo "$repo_url" "$ver" "$temp_ver_dir" 2>&1; then
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
