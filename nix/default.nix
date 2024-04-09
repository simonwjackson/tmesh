{pkgs, ...}:
pkgs.resholve.mkDerivation rec {
  pname = "tmesh";
  version = "unstable";
  src = ../src;

  postPatch = ''
  '';

  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall

    find $src -type f -exec bash -c 'file="$1"; install -Dm 755 "$file" "$out/''${file#$src/}"' -- {} \;

    # substituteInPlace $out/bin/* \
    #   --replace /etc/tmesh $out/etc/tmesh

    # mkdir -p $out/etc/tmesh
    # cp $src/etc/tmesh/*.tmux.conf $out/etc/tmesh

    runHook postInstall
  '';

  solutions = {
    default = {
      scripts = [
        "bin/tmesh"
        "bin/tmesh-server"
        "bin/*.sh"
      ];
      interpreter = "${pkgs.bash}/bin/bash";
      inputs =
        [
          "${placeholder "out"}/bin"
          pkgs.fzf
        ]
        ++ (with pkgs; [
          coreutils
          tmux
          coreutils
          gnused
          jq
          fd
          findutils
          bash
          gawk
          nettools
        ]);
      fake = {
        external = [
          # Make sure we can self reference our scripts
          "tmesh"
          "tmesh-server"
          "choose-host"
          "choose-session"
        ];
      };
      execer = [
        # resholve cannot verify args from these apps
        "cannot:${pkgs.tmux}/bin/tmux"
        "cannot:${pkgs.fzf}/bin/fzf"
        "cannot:${pkgs.fd}/bin/fd"
      ];
    };
  };

  meta = with pkgs.lib; {
    homepage = "https://github.com/simonwjackson/tmesh";
    description = "Effortlessly manage tmux sessions across multiple hosts.";
    license = licenses.gpl2Only;
    platforms = platforms.linux;
  };
}
