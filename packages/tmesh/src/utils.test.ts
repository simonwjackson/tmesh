import { describe, expect, it } from "bun:test";
import { hostname } from "node:os";

import {
  getParentDirName,
  isLocalhost,
  sanitizeSessionName,
  shellEscape,
} from "./utils";

describe("isLocalhost", () => {
  const currentHostname = hostname();

  it("should return true for 'localhost'", () => {
    expect(isLocalhost("localhost")).toBe(true);
  });

  it("should return true for '127.0.0.1'", () => {
    expect(isLocalhost("127.0.0.1")).toBe(true);
  });

  it("should return true for the current hostname", () => {
    expect(isLocalhost(currentHostname)).toBe(true);
  });

  it("should return false for other hostnames", () => {
    expect(isLocalhost("remote-server")).toBe(false);
    expect(isLocalhost("192.168.1.100")).toBe(false);
    expect(isLocalhost("example.com")).toBe(false);
  });
});

describe("shellEscape", () => {
  it("should not escape simple strings", () => {
    expect(shellEscape("hello")).toBe("hello");
    expect(shellEscape("hello-world")).toBe("hello-world");
    expect(shellEscape("hello_world")).toBe("hello_world");
    expect(shellEscape("/path/to/file")).toBe("/path/to/file");
    expect(shellEscape("file.txt")).toBe("file.txt");
  });

  it("should escape strings with spaces", () => {
    expect(shellEscape("hello world")).toBe("'hello world'");
    expect(shellEscape("path with spaces")).toBe("'path with spaces'");
  });

  it("should escape strings with special characters", () => {
    expect(shellEscape("hello$world")).toBe("'hello$world'");
    expect(shellEscape("hello`world`")).toBe("'hello`world`'");
    expect(shellEscape('hello"world"')).toBe("'hello\"world\"'");
  });

  it("should handle strings with single quotes", () => {
    expect(shellEscape("it's")).toBe("'it'\\''s'");
    expect(shellEscape("don't")).toBe("'don'\\''t'");
  });

  it("should handle empty strings", () => {
    expect(shellEscape("")).toBe("''");
  });
});

describe("sanitizeSessionName", () => {
  it("should keep alphanumeric characters", () => {
    expect(sanitizeSessionName("hello123")).toBe("hello123");
    expect(sanitizeSessionName("ABC")).toBe("ABC");
  });

  it("should keep underscores and hyphens", () => {
    expect(sanitizeSessionName("hello_world")).toBe("hello_world");
    expect(sanitizeSessionName("hello-world")).toBe("hello-world");
  });

  it("should replace other characters with hyphens", () => {
    expect(sanitizeSessionName("hello world")).toBe("hello-world");
    expect(sanitizeSessionName("hello.world")).toBe("hello-world");
    expect(sanitizeSessionName("hello@world")).toBe("hello-world");
    expect(sanitizeSessionName("hello/world")).toBe("hello-world");
  });

  it("should handle multiple special characters", () => {
    expect(sanitizeSessionName("hello.world@123")).toBe("hello-world-123");
  });
});

describe("getParentDirName", () => {
  it("should return the parent directory name", () => {
    expect(getParentDirName("/home/user/projects/myproject")).toBe("projects");
    expect(getParentDirName("/var/log/nginx")).toBe("log");
  });

  it("should handle paths with trailing slashes", () => {
    expect(getParentDirName("/home/user/projects/myproject/")).toBe("projects");
  });

  it("should return 'default' for shallow paths", () => {
    expect(getParentDirName("/home")).toBe("default");
    expect(getParentDirName("/")).toBe("default");
  });

  it("should handle relative paths", () => {
    expect(getParentDirName("parent/child")).toBe("parent");
  });
});
