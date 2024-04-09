{
  pkgs,
  tmesh,
}:
pkgs.dockerTools.buildLayeredImage {
  name = "tmesh";
  tag = "latest";
  config = {
    Cmd = ["${pkgs.lib.meta.getExe tmesh}"];
  };
  contents = [
    tmesh
  ];
}
