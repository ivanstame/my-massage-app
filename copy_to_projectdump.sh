#!/bin/bash

# Define the source directories
SOURCE_DIRS=("server" "src" "test" "docs" "config")

# Define the destination directory
DEST_DIR="$HOME/Desktop/projectdumpfolder"

# Create the destination directory if it doesn't exist
mkdir -p "$DEST_DIR"

# Loop through each source directory and copy all files (including subfolder files) to the destination directory
for DIR in "${SOURCE_DIRS[@]}"; do
    # Use `find` to locate all files in the directory and its subdirectories, then copy them to the destination
    find "$DIR" -type f -exec cp {} "$DEST_DIR/" \;
done

echo "All files from /server/ and /src/ have been copied to $DEST_DIR"
