{ self }:
{ config, lib, pkgs, ... }:
let
  inherit (pkgs.stdenv.hostPlatform) system;
  pname = "tmesh";

  package = self.packages.${system}.${pname};
  cfg = config.programs.${pname};
in {
  options.programs.${pname} = {
    enable = lib.mkEnableOption "${pname}";

    package = lib.mkOption {
      type = lib.types.package;
      default = package;
      description = "The package to use for ${pname}.";
    };

    settings = lib.mkOption {
      type = lib.types.attrs;
      default = {};
      description = "Configuration settings.";
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
    home.packages = [ cfg.package ];

    xdg.configFile = lib.mkMerge [
      (lib.mkIf (cfg.tmeshServerTmuxConfig != "") {
        "${pname}/tmesh-server.tmux.conf".text = cfg.tmeshServerTmuxConfig;
      })
      (lib.mkIf (cfg.tmeshTmuxConfig != "") {
        "${pname}/tmesh.tmux.conf".text = cfg.tmeshTmuxConfig;
      })
    ];
  };
}
