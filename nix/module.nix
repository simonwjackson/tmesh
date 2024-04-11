inputs: {
  config,
  lib,
  pkgs,
  ...
}: let
  inherit (pkgs.stdenv.hostPlatform) system;
  pname = "tmesh";

  package = inputs.self.packages.${system}.${pname};
  cfg = config.services.${pname};
  jsonConfig = builtins.toJSON cfg.settings;
  jsonConfigFile = pkgs.writeText "config.json" jsonConfig;
in {
  options.services.${pname} = {
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
  };

  config = lib.mkIf cfg.enable {
    environment.etc."${pname}/config.json".source = jsonConfigFile;

    environment.systemPackages = [
      (pkgs.writeScriptBin "${pname}-wrapped" ''
        #!${pkgs.stdenv.shell}
        exec ${pkgs.lib.meta.getExe cfg.package} --config ${jsonConfigFile} "$@"
      '')
    ];
  };
}
