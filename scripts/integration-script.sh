#!/bin/bash

TARGET_DIR="src/content/docs/"

# UDS Core is the base - copied first
# Other repos overlay on top without deleting uds-core files
repos=(
    "https://github.com/defenseunicorns/uds-core/ main ./temp/uds-core base"
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
      rsync -rt --delete "$local_path/docs/" "$TARGET_DIR/"
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
    rsync -rt --delete "${target_dir}/docs/" "$TARGET_DIR/"
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
