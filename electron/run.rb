#!/usr/bin/env ruby

def easy_store_path
  if (/cygwin|mswin|mingw|bccwin|wince|emx/ =~ RUBY_PLATFORM)
    return '.'
  end
  return File.expand_path(File.dirname(__FILE__))
end

def path_to_node_electron
  path = File.join(easy_store_path, "node_modules", ".bin", "electron")
  if File.exist?(path)
    return path
  end
  return nil
end

if __FILE__ == $0
  cmd = "#{path_to_node_electron} #{easy_store_path}"
  puts cmd
  pid = Process.spawn(cmd, { chdir: easy_store_path() })
  puts "Running with pid #{pid}. Control-C to exit."
  Process.wait(pid)
end
