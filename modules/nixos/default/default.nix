{ self }:
{
  config,
  lib,
  pkgs,
  ...
}: let
  inherit (pkgs.stdenv.hostPlatform) system;
  inherit (lib) mkEnableOption mkOption types mkIf;
  pname = "tmesh";

  package = self.packages.${system}.${pname};
  cfg = config.programs.${pname};

  # Convert Nix attrs to YAML using yj
  toYAML = name: data: pkgs.runCommand name {
    nativeBuildInputs = [ pkgs.yj ];
    json = builtins.toJSON data;
    passAsFile = [ "json" ];
  } ''
    yj -jy < "$jsonPath" > "$out"
  '';

  # Build the config.yaml content
  configFile = toYAML "tmesh-config.yaml" {
    inherit (cfg) apps socket session;
    popup = cfg.popup;
  };

  # App submodule type
  appType = types.submodule {
    options = {
      name = mkOption {
        type = types.str;
        description = "Display name for the app.";
        example = "lazygit";
      };
      cmd = mkOption {
        type = types.str;
        description = "Command to run. Supports $VAR environment variable expansion.";
        example = "lazygit";
      };
      icon = mkOption {
        type = types.str;
        default = "";
        description = "Icon/emoji shown before the app name.";
        example = "";
      };
    };
  };
in {
  options.programs.${pname} = {
    enable = mkEnableOption "${pname}";

    package = mkOption {
      type = types.package;
      default = package;
      description = "The package to use for ${pname}.";
    };

    apps = mkOption {
      type = types.listOf appType;
      default = [
        { name = "shell"; cmd = "$SHELL"; icon = ""; }
        { name = "htop"; cmd = "htop"; icon = ""; }
        { name = "btop"; cmd = "btop"; icon = ""; }
        { name = "lazygit"; cmd = "lazygit"; icon = ""; }
      ];
      description = "List of apps available in the app selector.";
      example = lib.literalExpression ''
        [
          { name = "shell"; cmd = "$SHELL"; icon = ""; }
          { name = "lazygit"; cmd = "lazygit"; icon = ""; }
          { name = "nvim"; cmd = "nvim"; icon = ""; }
        ]
      '';
    };

    popup = {
      titles = {
        terminal = mkOption {
          type = types.str;
          default = " Terminal ";
          description = "Title for the terminal popup window.";
        };
        apps = mkOption {
          type = types.str;
          default = " Apps ";
          description = "Title for the apps selector popup window.";
        };
      };
    };

    socket = mkOption {
      type = types.str;
      default = "tmesh-apps";
      description = "Socket name for tmesh tmux instances.";
    };

    session = mkOption {
      type = types.str;
      default = "apps";
      description = "Session name for the apps session.";
    };

    tmeshServerTmuxConfig = mkOption {
      type = types.lines;
      default = "";
      description = "Tmux configuration for tmesh server.";
    };

    tmeshTmuxConfig = mkOption {
      type = types.lines;
      default = "";
      description = "Tmux configuration for tmesh.";
    };
  };

  config = mkIf cfg.enable {
    environment.etc."${pname}/config.yaml" = {
      source = configFile;
      mode = "0644";
    };

    environment.etc."${pname}/tmux.conf" = {
      text = cfg.tmeshTmuxConfig;
      mode = "0644";
    };

    environment.systemPackages = [
      cfg.package
    ];
  };
}
