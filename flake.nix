{
  description = "Effortlessly manage tmux sessions across multiple hosts";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    snowfall-lib = {
      url = "github:snowfallorg/lib";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    snowfall-frost = {
      url = "github:snowfallorg/frost";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  #   outputs = {
  #     self,
  #     nixpkgs,
  #     flake-utils,
  #     ...
  #   } @ inputs:
  #     flake-utils.lib.eachDefaultSystem (
  #       system: let
  #         pkgs = nixpkgs.legacyPackages.${system};
  #         tmesh = import ./nix/default.nix {
  #           inherit pkgs;
  #         };
  #         tmesh-module = import ./nix/module.nix inputs;
  #         docker = import ./nix/docker.nix {
  #           inherit pkgs tmesh;
  #         };
  #       in {
  #         packages.tmesh = tmesh;
  #         packages.docker = docker;
  #         nixosModules.default = tmesh-module;
  #
  #         defaultPackage = tmesh;
  #       }
  #     );
  # }
  #

  # outputs = inputs:
  #   inputs.snowfall-lib.mkFlake {
  #     inherit inputs;
  #     src = ./.;
  #
  #     overlays = with inputs; [
  #       snowfall-frost.overlays.default
  #     ];
  #
  #     channels-config = {
  #       allowUnfree = true;
  #     };
  #
  #     snowfall = {
  #       namespace = "tmesh";
  #
  #       meta = {
  #         name = "tmesh";
  #         title = "tmesh";
  #       };
  #     };
  #   };

  outputs = inputs:
  # This is an example and in your actual flake you can use `snowfall-lib.mkFlake`
  # directly unless you explicitly need a feature of `lib`.
  let
    lib = inputs.snowfall-lib.mkLib {
      # You must pass in both your flake's inputs and the root directory of
      # your flake.
      inherit inputs;
      src = ./.;
    };
  in
    lib.mkFlake {
      alias = {
        packages = {
          default = "tmesh";
        };

        # shells = {
        #   default = "my-shell";
        # };
        #
        # modules = {
        #   default = "my-module";
        # };
        #
        # templates = {
        #   default = "my-template";
        # };
      };
    };
}
