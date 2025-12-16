{
  description = "Effortlessly manage tmux sessions across multiple hosts";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = {
    self,
    nixpkgs,
  }: let
    supportedSystems = [
      "x86_64-linux"
      "aarch64-linux"
      "x86_64-darwin"
      "aarch64-darwin"
    ];

    forAllSystems = nixpkgs.lib.genAttrs supportedSystems;

    pkgsFor = system:
      import nixpkgs {
        inherit system;
        config.allowUnfree = true;
      };
  in {
    packages = forAllSystems (system: let
      pkgs = pkgsFor system;
    in {
      tmesh = pkgs.callPackage ./packages/tmesh {};
      default = self.packages.${system}.tmesh;
    });

    devShells = forAllSystems (system: let
      pkgs = pkgsFor system;
    in {
      default = pkgs.callPackage ./shells/default {};
    });

    nixosModules = {
      tmesh = import ./modules/nixos/default { inherit self; };
      default = self.nixosModules.tmesh;
    };

    homeManagerModules = {
      tmesh = import ./modules/home-manager { inherit self; };
      default = self.homeManagerModules.tmesh;
    };

    overlays.default = final: prev: {
      tmesh = self.packages.${prev.stdenv.hostPlatform.system}.tmesh;
    };
  };
}
