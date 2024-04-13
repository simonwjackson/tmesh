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

[![FlakeHub](https://img.shields.io/endpoint?url=https://flakehub.com/f/simonwjackson/tmesh/badge)](https://flakehub.com/flake/simonwjackson/tmesh)

## Key Features

* 🖥️ Multi-host support: Manage sessions across multiple servers.
* 🔀 Seamless switching: Easily navigate and switch between sessions on all hosts.
* 🌐 Network Persistance: Maintains remote sessions between network disruptions.
* 🎚️ Customizable: Define your own list of potential sessions and apps for each host.

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
