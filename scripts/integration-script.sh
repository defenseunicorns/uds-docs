#!/bin/bash

TARGET_DIR="src/content/docs/"

repos=(
    "https://github.com/defenseunicorns/uds-core/ main ./temp/uds-core"
    "https://github.com/defenseunicorns/uds-identity-config main ./temp/uds-identity-config"
    "https://github.com/defenseunicorns/uds-cli main ./temp/cli"
    "https://github.com/defenseunicorns/uds-rke2-demo main ./temp/uds-rke-demo tutorials"
)

mkdir temp

REFERENCE_DIR="${TARGET_DIR}/reference"
TROUBLESHOOTING_DIR="${TARGET_DIR}/troubleshooting"

# Wipe the directories and start fresh so there aren't duplicates in case files are moved or renamed
echo "Cleaning reference and troubleshooting directories..."

find "$TARGET_DIR" -type d \( -name "reference" -o -name "troubleshooting" \) -exec rm -rf {} +
mkdir -p "${TARGET_DIR}/reference" "${TARGET_DIR}/troubleshooting" "${TARGET_DIR}/tutorials"

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
    # Split the repo_info string into url, branch, target_dir, and optional destination
    IFS=' ' read -r -a repo <<< "$repo_info"
    clone_repo "${repo[0]}" "${repo[1]}" "${repo[2]}"
    echo -e "Cloned ${repo[0]}@${repo[1]} into ${repo[2]}\n"

    # Copy the repo's content:
    # - default: from "docs"  -> $TARGET_DIR
    # - if repo[3] is set (e.g., "tutorials"): from "docs/<dest>" -> $TARGET_DIR/<dest>
    dest="${repo[3]:-}"
    src_subpath="docs${dest:+/$dest}"
    dest_dir="$TARGET_DIR${dest:+/$dest}"

    mkdir -p "$dest_dir"
    if [[ -d "${repo[2]}/$src_subpath" ]]; then
      cp -r "${repo[2]}/$src_subpath/"* "$dest_dir/"
    else
      echo "Warning: source '${repo[2]}/$src_subpath' not found; skipping."
    fi
done

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
