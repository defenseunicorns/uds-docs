#!/bin/bash

TARGET_DIR="src/content/docs/"

repos=(
    "https://github.com/defenseunicorns/uds-core/ main ./temp/uds-core"
    "https://github.com/defenseunicorns/uds-identity-config main ./temp/uds-identity-config"
    "https://github.com/defenseunicorns/uds-cli main ./temp/cli"
)

mkdir temp

REFERENCE_DIR="${TARGET_DIR}/reference"
TROUBLESHOOTING_DIR="${TARGET_DIR}/troubleshooting"

# Wipe the directories and start fresh so there aren't duplicates in case files are moved or renamed
echo "Cleaning reference and troubleshooting directories..."

find "$TARGET_DIR" -type d \( -name "reference" -o -name "troubleshooting" \) -exec rm -rf {} +
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
    # Split the repo_info string into url, branch, and target_dir
    IFS=' ' read -r -a repo <<< "$repo_info"
    clone_repo "${repo[0]}" "${repo[1]}" "${repo[2]}"
    echo -e "Cloned ${repo[0]}@${repo[1]} into ${repo[2]}\n"

    # Copy the docs folder to the target directory
    cp -r "${repo[2]}/docs/"* "$TARGET_DIR/"
done

# Clean up and remove the temp folder
rm -rf temp

# Remove the dev and adr docs folders if present
rm -rf "$TARGET_DIR/dev"
rm -rf "$TARGET_DIR/adr"

## this allows for naming directories in lowercase and hyphenated formats, still allows for space formatting
BASE_DIR="src/content/docs/reference"

# Reverse depth-first directory renaming, preserving acronyms and formatting
find "$BASE_DIR" -type d ! -path "$BASE_DIR" | awk '{ print length, $0 }' | sort -rn | cut -d" " -f2- | while read -r dir; do
  base=$(basename "$dir")
  parent=$(dirname "$dir")

  # Skip if already space-formatted and not hyphenated
  [[ "$base" == *" "* && "$base" != *"-"* ]] && continue

  # Convert kebab-case to spaced words with acronym support
  new_base=$(echo "$base" | sed -E 's/-/ /g' | awk '{
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
