#!/bin/bash

TARGET_DIR="src/content/docs/reference/temp"

repos=(
    "https://github.com/defenseunicorns/uds-core v0.27.3 ./temp/uds-core"
#    "https://github.com/defenseunicorns/uds-identity-config v0.6.3 ./repo-docs/uds-identity-config"
    "https://github.com/defenseunicorns/uds-cli v0.16.0 ./repo-docs/cli"
)

# Function to clone a repository
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
    git clone --branch "$branch" --single-branch "$repo_url" "$target_dir"
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
rm -rf temp