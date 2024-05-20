{
  config,
  inputs,
  lib,
  pkgs,
  ...
}: let
  inherit (pkgs.stdenv.hostPlatform) system;
  pname = "tmesh";

  package = inputs.self.packages.${system}.${pname};
  cfg = config.programs.${pname};
  jsonConfig = builtins.toJSON cfg.settings;
  jsonConfigFile = pkgs.writeText "config.json" jsonConfig;
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
    environment.etc."${pname}/config.json".source = jsonConfigFile;

    environment.etc."${pname}/tmesh-server.tmux.conf" = {
      text = cfg.tmeshServerTmuxConfig;
      mode = "0644";
    };

    environment.etc."${pname}/tmesh.tmux.conf" = {
      text = cfg.tmeshTmuxConfig;
      mode = "0644";
    };

    environment.systemPackages = [
      (pkgs.writeScriptBin "${pname}" ''
        #!${pkgs.stdenv.shell}
        exec ${pkgs.lib.meta.getExe cfg.package} --config ${jsonConfigFile} "$@"
      '')
    ];
  };
}
