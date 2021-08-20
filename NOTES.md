# Notes

## Generating a new package
May want to turn this into a workspace generator in the future

```
npm run nx generate @nrwl/node:library -- --name=stripe \
  --buildable \
  --importPath=@deepkit-community/stripe \
  --publishable \
  --standaloneConfig \
  --strict \
  --testEnvironment=node \
  --no-interactive \
  --dry-run
```
