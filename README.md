<p align="center">
<h1>tmesh</h1>
</p>

<p align="center">
Effortlessly manage tmux sessions across multiple hosts.
</p>

<p align="center">
tmesh is a powerful script that simplifies the process of accessing and managing tmux sessions across different servers, allowing you to seamlessly switch between sessions and hosts with ease.
</p>

<p align="center">
  <img src="./dawg.jpg" alt="yo dawg" />
</p>

<p align="center">
<a href="https://github.com/simonwjackson/tmesh/stargazers"><img src="https://img.shields.io/github/stars/simonwjackson/tmesh?color=c678dd&logoColor=e06c75&style=for-the-badge"></a>
<a href="https://github.com/simonwjackson/tmesh/issues"><img src="https://img.shields.io/github/issues/simonwjackson/tmesh?color=%23d19a66&style=for-the-badge"></a>
<a href="https://github.com/simonwjackson/tmesh/blob/main/LICENSE"><img src="https://img.shields.io/github/license/simonwjackson/tmesh?style=for-the-badge"></a>
<a href="https://flakehub.com/flake/simonwjackson/tmesh"><img src="https://img.shields.io/badge/flakehub-latest-blue?style=for-the-badge"></a>
<!-- <a href="https://github.com/simonwjackson/tmesh/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/simonwjackson/tmesh/ci.yml?branch=main&label=tests&style=for-the-badge"></a> -->
</p>

## Key Features

* 🖥️ Multi-host support: Manage sessions across multiple servers.
* 🔀 Seamless switching: Easily navigate and switch between sessions on all hosts.
* 🌐 Network Persistance: Maintains remote sessions between network disruptions.
* 🎚️ Customizable: Define your own list of potential sessions and apps for each host.

> [!IMPORTANT]
> This repo is provided as-is and is primarily developed for my own workflows. As such, I offer no guarantees of regular updates or support. Bug fixes and feature enhancements will be implemented at my discretion, and only if they align with my personal use-cases. Feel free to fork the project and customize it to your needs, but please understand my involvement in further development will be intermittent.

## Try it out

```
nix run 'github:simonwjackson/tmesh'
```

If the above command fails, try the following:

> Enable flakes (inline)
>
> nix --experimental-features 'nix-command flakes' run 'github:simonwjackson/tmesh'
>
> Ignore a cached version
>
> nix run --refresh 'github:simonwjackson/tmesh'

# Usage as a flake


Add tmesh to your `flake.nix`:

```nix
{
  inputs.tmesh.url = "https://flakehub.com/f/simonwjackson/tmesh/*.tar.gz";

  outputs = { self, tmesh }: {
    # Use in your outputs
  };
}
```
