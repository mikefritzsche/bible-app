# Local Bible Modules

Place downloaded Bible translation JSON files in this directory while developing locally.

These payloads are ignored by git (see `.gitignore`) so you can keep large module files on disk without
committing them to the repository. The Bible loader already looks inside `/bibles/modules/<version>.json`, so
as long as the filename matches the module ID (for example `kjv-strongs.json`) the app will pick it up.
