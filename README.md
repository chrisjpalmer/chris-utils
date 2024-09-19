# Chris's work utils

A bunch of miscellanious utils for doing stuff that I (Chris) like (primarily bitbucket).

## Requirements

- Mac
- Asdf

## Getting Started

```sh
git clone https://github.com/chrisjpalmer/chris-utils ~/scripts
cd ~/scripts
asdf install
npm install
```

Add the following to your `~/.zshrc` or `~/.bashrc`:

```sh
export PATH=$HOME/scripts/bin:$PATH
```

## Configure

To configure the scripts, you need to copy the config template and fill it in.
You will need to generate a bitbucket app password with the scopes:

- `repositories:read`
- `pullrequests:read`
- `workspacemembership:read`

```sh
cd ~/scripts
cp config.yaml.template config.yaml
echo "*.prchain" >> ~/.gitignore && git config --global core.excludesFile '~/.gitignore'
```

## Available Commands

### `alpha` - allows you to sort tokens in alphabetical order

```sh
> alpha
Enter the tokens for alphabetical ordering:

> night
> message
> 

message
night
```

### `prs` - fetches pr urls from a list of branches

***Requires connection to bitbucket***

```sh
> cd my-git-repo
> prs "branch-a
 branch-b"

Do an A thing - https://bitbucket.org/xxx/my-repo/pull-requests/1
Do a B thing - https://bitbucket.org/xxx/my-repo/pull-requests/2
copied to clipboard!
```

You can go to slack and paste the links there to spam your team mates with PRs.

### `body` - copies the body of your commit message

```sh
> cd my-git-repo
> body

copied!
```

Line wrapping is removed so it will look natural when pasting into the description of a PR.

### `subject` - copies the subject line of your commit message

```sh
> cd my-git-repo
> subject

copied!
```

### `rebase` - provides commands to rebase a chain of branches

***requires the following alias***

```zsh
alias forcepush="git push -f"
```

When working with pr chains you may have a setup like so:

```
branch b -> branch a -> master
```

If you make a change to master, how can you quickly rebase all those branches?

```sh
> cd my-git-repo
> rebase "master
 branch-a
 branch-b"

git checkout branch-a && git rebase -i master
git checkout branch-b && git rebase -i branch-a
 
forcepush origin branch-a
forcepush origin branch-b
```

Copy and paste the commands into the terminal.


