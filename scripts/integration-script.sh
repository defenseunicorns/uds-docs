#!/bin/bash

TARGET_DIR="src/content/docs/"

repos=(
    "https://github.com/defenseunicorns/uds-core/ 1282-SSO_docs_refactoring ./temp/uds-core"
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

# Remove the dev docs folders if present
rm -rf "$TARGET_DIR/dev"
