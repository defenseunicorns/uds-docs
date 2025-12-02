#!/bin/bash

TARGET_DIR="src/content/docs/"

repos=(
    "https://github.com/defenseunicorns/uds-core/ main ./temp/uds-core"
    "https://github.com/defenseunicorns/uds-identity-config main ./temp/uds-identity-config"
    "https://github.com/defenseunicorns/uds-cli main ./temp/cli"
    "https://github.com/defenseunicorns-labs/uds-rke2-demo main ./temp/uds-rke-demo tutorials"
)

mkdir temp

REFERENCE_DIR="${TARGET_DIR}/reference"
TROUBLESHOOTING_DIR="${TARGET_DIR}/troubleshooting"

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

# Start clean: remove common destination subdirectories composed from multiple sources
rm -rf "${TARGET_DIR}/reference" "${TARGET_DIR}/troubleshooting"
mkdir -p "${TARGET_DIR}/reference" "${TARGET_DIR}/troubleshooting"

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

# Loop through each repository and clone it
for repo_info in "${repos[@]}"; do
  IFS=' ' read -r -a repo <<< "$repo_info"
  repo_url="${repo[0]}"
  branch="${repo[1]}"
  target_dir="${repo[2]}"
  dest="${repo[3]:-}" # optional, e.g. 'tutorials'

  key="$(repo_key_from_url "$repo_url")"
  # Fallback if URL produced an empty key (e.g., trailing slash edge cases)
  if [[ -z "$key" ]]; then
    key="${target_dir##*/}"
  fi
  src_subpath="docs${dest:+/$dest}"
  dest_dir="$TARGET_DIR${dest:+/$dest}"
  # If this is the tutorials destination, ensure a clean slate once
  if [[ -n "$dest" && "$dest" == "tutorials" && -z "${CLEANED_TUTORIALS:-}" ]]; then
    rm -rf "$dest_dir"
    mkdir -p "$dest_dir"
    CLEANED_TUTORIALS=1
  fi
  mkdir -p "$dest_dir"

  # Local override path
  if [[ ${OVERRIDES[$key]+_} ]]; then
    local_path="${OVERRIDES[$key]}"
    echo "Using local override for '$key': $local_path"
    if [[ -d "$local_path/$src_subpath" ]]; then
      # Overlay copy (keeps other repos intact) without suppressing errors
      rsync -rt "$local_path/$src_subpath/" "$dest_dir/"
    else
      echo "Warning: override source '$local_path/$src_subpath' not found; skipping."
    fi
    continue
  fi

  # Default: clone and copy
  clone_repo "$repo_url" "$branch" "$target_dir"
  echo -e "Cloned ${repo_url}@${branch} into ${target_dir}\n"

  if [[ -d "${target_dir}/$src_subpath" ]]; then
    # Copy without suppressing errors and without globbing pitfalls
    rsync -rt "${target_dir}/$src_subpath/" "$dest_dir/"
  else
    echo "Warning: source '${target_dir}/$src_subpath' not found; skipping."
  fi
done

# Copy only uds-core LikeC4 model
uds_core_override="${OVERRIDES[uds-core]:-}"
if [[ -n "$uds_core_override" && -d "$uds_core_override/docs/.c4" ]]; then
  rm -rf "${TARGET_DIR}/.c4"
  mkdir -p "${TARGET_DIR}/.c4"
  cp -r "$uds_core_override/docs/.c4/." "${TARGET_DIR}/.c4/"
elif [[ -d "./temp/uds-core/docs/.c4" ]]; then
  rm -rf "${TARGET_DIR}/.c4"
  mkdir -p "${TARGET_DIR}/.c4"
  cp -r "./temp/uds-core/docs/.c4/." "${TARGET_DIR}/.c4/"
fi

# Clean up and remove the temp folder
rm -rf temp

# Remove the dev and adr docs folders if present
rm -rf "$TARGET_DIR/dev"
rm -rf "$TARGET_DIR/adr"

## this allows for naming directories in lowercase and hyphenated formats, still allows for space formatting
# Run kebab->spaced renaming in both reference and tutorials
BASE_DIRS=(
  "src/content/docs/reference"
  "src/content/docs/tutorials"
)

for BASE_DIR in "${BASE_DIRS[@]}"; do
  [[ -d "$BASE_DIR" ]] || continue

  # Reverse depth-first directory renaming, preserving acronyms and formatting
  find "$BASE_DIR" -type d ! -path "$BASE_DIR" | awk '{ print length, $0 }' | sort -rn | cut -d" " -f2- | while read -r dir; do
    base=$(basename "$dir")
    parent=$(dirname "$dir")

    # Skip if already space-formatted and not hyphenated
    [[ "$base" == *" "* && "$base" != *"-"* ]] && continue

    # Convert kebab-case to spaced words with acronym support
    new_base=$(echo "$base" | sed -E 's/-/ /g' | awk '{
      orig = tolower($0)
      if (orig == "single sign on") {
        print "Single Sign-On"
        next
      }

      for (i = 1; i <= NF; i++) {
        if (tolower($i) == "uds") $i = "UDS";
        else if (tolower($i) == "idam") $i = "IdAM";
        else $i = toupper(substr($i,1,1)) substr($i,2)
      }
      print
    }')

    new_path="$parent/$new_base"

    if [ "$dir" != "$new_path" ] && [ ! -e "$new_path" ]; then
      echo "Renaming: $dir → $new_path"
      mv "$dir" "$new_path"
    fi
  done
done
