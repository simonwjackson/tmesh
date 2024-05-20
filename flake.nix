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

  outputs = inputs: let
    lib = inputs.snowfall-lib.mkLib {
      # You must pass in both your flake's inputs and the root directory of
      # your flake.
      inherit inputs;
      src = ./.;
    };
  in
    lib.mkFlake {
      channels-config = {
        allowUnfree = true;
      };

      snowfall = {
        namespace = "tmesh";

        meta = {
          name = "tmesh";
          title = "tmesh";
        };
      };

      alias = {
        packages = {
          default = "tmesh";
        };

        # shells = {
        #   default = "my-shell";
        # };

        modules = {
          default = "tmesh";
        };

        # templates = {
        #   default = "my-template";
        # };
      };
    };
}
