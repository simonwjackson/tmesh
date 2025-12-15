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
      tmesh = {
        config,
        lib,
        pkgs,
        ...
      }: let
        inherit (pkgs.stdenv.hostPlatform) system;
        pname = "tmesh";
        package = self.packages.${system}.${pname};
        cfg = config.programs.${pname};
      in {
        options.programs.${pname} = {
          enable = lib.mkEnableOption "${pname}";

          settings = lib.mkOption {
            type = lib.types.attrs;
            default = {};
            description = "Configuration settings.";
          };

          package = lib.mkOption {
            type = lib.types.package;
            default = package;
            description = "The package to use for ${pname}.";
          };

          tmeshServerTmuxConfig = lib.mkOption {
            type = lib.types.lines;
            default = "";
            description = "Tmux configuration for tmesh server.";
          };

          tmeshTmuxConfig = lib.mkOption {
            type = lib.types.lines;
            default = "";
            description = "Tmux configuration for tmesh.";
          };
        };

        config = lib.mkIf cfg.enable {
          environment.etc."${pname}/tmesh-server.tmux.conf" = {
            text = cfg.tmeshServerTmuxConfig;
            mode = "0644";
          };

          environment.etc."${pname}/tmesh.tmux.conf" = {
            text = cfg.tmeshTmuxConfig;
            mode = "0644";
          };

          environment.systemPackages = [
            cfg.package
          ];
        };
      };
      default = self.nixosModules.tmesh;
    };

    homeManagerModules = {
      tmesh = {
        config,
        lib,
        pkgs,
        ...
      }: let
        inherit (pkgs.stdenv.hostPlatform) system;
        pname = "tmesh";
        package = self.packages.${system}.${pname};
        cfg = config.programs.${pname};
      in {
        options.programs.${pname} = {
          enable = lib.mkEnableOption "${pname}";

          settings = lib.mkOption {
            type = lib.types.attrs;
            default = {};
            description = "Configuration settings.";
          };

          package = lib.mkOption {
            type = lib.types.package;
            default = package;
            description = "The package to use for ${pname}.";
          };

          tmeshServerTmuxConfig = lib.mkOption {
            type = lib.types.lines;
            default = "";
            description = "Tmux configuration for tmesh server.";
          };

          tmeshTmuxConfig = lib.mkOption {
            type = lib.types.lines;
            default = "";
            description = "Tmux configuration for tmesh.";
          };
        };

        config = lib.mkIf cfg.enable {
          xdg.configFile."${pname}/tmesh-server.tmux.conf" = {
            text = cfg.tmeshServerTmuxConfig;
          };

          xdg.configFile."${pname}/tmesh.tmux.conf" = {
            text = cfg.tmeshTmuxConfig;
          };

          home.packages = [
            cfg.package
          ];
        };
      };
      default = self.homeManagerModules.tmesh;
    };

    overlays.default = final: prev: {
      tmesh = self.packages.${prev.stdenv.hostPlatform.system}.tmesh;
    };
  };
}
