{pkgs, ...}: let
  server-select = pkgs.writeShellScriptBin "server-select.sh" (builtins.readFile ./bin/server-select.sh);

  runtimeInputs = with pkgs; [
    bash
    coreutils
    fd
    findutils
    fzf
    gawk
    gnused
    jq
    mosh
    nettools
    tmux
    yq-go
    server-select
  ];
in
  pkgs.writeShellApplication {
    name = "tmesh";

    runtimeInputs = runtimeInputs;

    text = builtins.readFile ./bin/tmesh;

    meta = with pkgs.lib; {
      description = "Effortlessly manage tmux sessions across multiple hosts.";
      homepage = "https://github.com/simonwjackson/tmesh";
      license = licenses.gpl2Only;
      platforms = platforms.linux;
      mainProgram = "tmesh";
    };
  }
