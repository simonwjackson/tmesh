{
  description = "A Nix flake for tmesh including a NixOS module";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
    ...
  } @ inputs:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = nixpkgs.legacyPackages.${system};
        tmesh = import ./nix/default.nix {
          inherit pkgs;
        };
        tmesh-module = import ./nix/module.nix inputs;
        # docker = import ./nix/docker.nix {
        #   inherit pkgs tmesh;
        # };
      in {
        packages.tmesh = tmesh;
        # packages.docker = docker;
        nixosModules.default = tmesh-module;

        defaultPackage = tmesh;
      }
    );
}
