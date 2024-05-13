## Chris's work utils

A bunch of miscellanious utils for doing stuff that I (Chris) like.

### Requirements

- Mac
- Asdf

### Getting Started

```sh
git clone https://github.com/chrisjpalmer/chris-utils ~/scripts
cd ~/scripts
asdf install
npm install
```

Add the following to your `~/.zshrc`:

```sh
export PATH=$HOME/scripts/bin:$PATH
```

### Configure

```sh
cd ~/scripts
cp config.yaml.template config.yaml

# fill in config.yaml - you will need to generate a bitbucket app password for the apiToken one
```

