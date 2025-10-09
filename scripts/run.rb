#!/usr/bin/env ruby
# coding: utf-8

require 'fileutils'

class Runner

  def initialize
    @start_time = Time.now
    @minio_pid = 0
    @dart_pid = 0
    @docker_sftp_id = ''
    @sftp_started = false
  end

  def run_tests
    make_test_dirs
    start_minio
    start_sftp
    `go clean -testcache`
    cmd = "go test -race -p 1 ./... -coverprofile c.out"
    pid = Process.spawn(ENV, cmd, chdir: project_root)
    Process.wait pid
    exit_code = $?.exitstatus
    if $?.success?
      puts "😊 PASSED 😊"
      puts "To generate HTML report: > go tool cover -html=c.out"
    else
      puts "😡 FAILED 😡"
    end
    exit(exit_code)
  end

  def run_dart
    begin
      @dart_pid = Process.spawn(ENV, "go run -race dart/main.go -port 8444", chdir: project_root)
      sleep(1)
      puts "\n\n\n"
      puts "DART is running at http://localhost:8444"
      start_minio
      start_sftp
      puts "\n"
      puts "Control-C will stop DART, SFTP and Minio\n\n"
      Process.wait @dart_pid
    rescue SystemExit, Interrupt
      puts "\nEt tu, Brute! Then fall, Caesar."
    end
  end

  # Run the Minio and SFTP containers. This enables you to
  # start DART separately in debug mode so you do end-to-end
  # debugging of jobs that include uploads.
  def run_services
    begin
      start_minio
      start_sftp
      puts "\n"
      puts "Control-C will stop SFTP and Minio containers\n\n"
      # Snooze until we get Ctrl-C interrupt from the user.
      loop do
        sleep(1)
      end
    rescue SystemExit, Interrupt
      puts "\nKill me, eh? Alright then, off I go."
    end
  end

  def stop_dart
    if !@dart_pid
        puts "Pid for DART is zero. Can't kill that..."
        return
    end
    puts "Stopping DART service (pid #{@dart_pid})"
    begin
      Process.kill('TERM', @dart_pid)
    rescue
      puts "Could not kill DART. :("
    end
  end

  def start_minio
    puts "Starting Minio container"
    @docker_minio_id = `docker run -p 9899:9000 -p 9001:9001 -d minio/minio:RELEASE.2023-12-07T04-16-00Z server /data --console-address ":9001"`
    @docker_minio_id = @docker_minio_id.chomp
    if $?.exitstatus == 0
      puts "Started Minio server with id #{@docker_minio_id}"
      puts "Minio is running on localhost:9899. User/Pwd: minioadmin/minioadmin"
      puts "Minio console available at http://127.0.0.1:9001"
      @minio_started = true
      # Make our two test buckets, plus receiving and
      # restoration buckets for test.edu.
      `docker exec -it #{@docker_minio_id} mkdir /data/test`
      `docker exec -it #{@docker_minio_id} mkdir /data/dart-runner.test`
      `docker exec -it #{@docker_minio_id} mkdir /data/preservation-or`
      `docker exec -it #{@docker_minio_id} mkdir /data/preservation-va`
      `docker exec -it #{@docker_minio_id} mkdir /data/glacier-oh`
      `docker exec -it #{@docker_minio_id} mkdir /data/glacier-or`
      `docker exec -it #{@docker_minio_id} mkdir /data/glacier-va`
      `docker exec -it #{@docker_minio_id} mkdir /data/glacier-deep-oh`
      `docker exec -it #{@docker_minio_id} mkdir /data/glacier-deep-or`
      `docker exec -it #{@docker_minio_id} mkdir /data/glacier-deep-va`
      `docker exec -it #{@docker_minio_id} mkdir /data/wasabi-or`
      `docker exec -it #{@docker_minio_id} mkdir /data/wasabi-tx`
      `docker exec -it #{@docker_minio_id} mkdir /data/wasabi-va`
      `docker exec -it #{@docker_minio_id} mkdir /data/receiving`
      `docker exec -it #{@docker_minio_id} mkdir /data/staging`
      `docker exec -it #{@docker_minio_id} mkdir /data/aptrust.receiving.test.test.edu`
      `docker exec -it #{@docker_minio_id} mkdir /data/aptrust.restore.test.test.edu`
      `docker exec -it #{@docker_minio_id} mkdir /data/aptrust.receiving.test.institution1.edu`
      `docker exec -it #{@docker_minio_id} mkdir /data/aptrust.restore.test.institution1.edu`
      `docker exec -it #{@docker_minio_id} mkdir /data/aptrust.receiving.test.institution2.edu`
      `docker exec -it #{@docker_minio_id} mkdir /data/aptrust.restore.test.institution2.edu`
      `docker exec -it #{@docker_minio_id} mkdir /data/aptrust.receiving.test.example.edu`
      `docker exec -it #{@docker_minio_id} mkdir /data/aptrust.restore.test.example.edu`
    else
      puts "Error starting Minio docker container. Is one already running?"
      puts @docker_minio_id
    end
  end

  def stop_minio
    if @minio_started
      result = `docker stop #{@docker_minio_id}`
      if $?.exitstatus == 0
        puts "Stopped docker Minio service"
      else
        puts "Failed to stop docker Minio service with id #{@docker_minio_id}"
        puts "See if you can kill it."
        puts "Hint: run `docker ps` and look for the image named 'minio/minio'"
      end
    else
      puts "Not killing Minio service because it failed to start"
    end
  end

  # This command starts a docker container that runs an SFTP service.
  # We use this to test SFTP uploads.
  #
  # The first -v option sets #{sftp_dir}/sftp_user_key.pub as the public
  # key for user "key_user" inside the docker container. We set this so
  # we can test connections the use an SSH key.
  #
  # The second -v option tells the container to create accounts for the
  # users listed in #{sftp_dir}/users.conf. There are two. key_user has
  # no password and will connect with an SSH key. pw_user will connect
  # with the password "password".
  #
  # We forward local port 2222 to the container's port 22, which means we
  # can get to the SFTP server via locahost:2222 or 127.0.0.1:2222.
  def start_sftp
    sftp_dir = File.join(project_root, "testdata", "sftp")
    puts "Using SFTP config options from #{sftp_dir}"
    @docker_sftp_id = `docker run \
    -v #{sftp_dir}/sftp_user_key.pub:/home/key_user/.ssh/keys/sftp_user_key.pub:ro \
    -v #{sftp_dir}/users.conf:/etc/sftp/users.conf:ro \
    -p 2222:22 -d #{sftp_image_name}`
    if $?.exitstatus == 0
      puts "Started SFTP server with id #{@docker_sftp_id}"
      puts "To log in and view the contents, use "
      puts "sftp -P 2222 pw_user@localhost"
      puts "The password is 'password' without the quotes"
      @sftp_started = true
    else
      puts "Error starting SFTP docker container. Is one already running?"
      puts @docker_sftp_id
    end
  end

  def stop_sftp
    if @sftp_started
      result = `docker stop #{@docker_sftp_id}`
      if $?.exitstatus == 0
        puts "Stopped docker SFTP service"
      else
        puts "Failed to stop docker SFTP service with id #{@docker_sftp_id}"
        puts "See if you can kill it."
        puts "Hint: run `docker ps` and look for the image named 'atmoz/sftp'"
      end
    else
      puts "Not killing SFTP service because it failed to start"
    end
  end

  # In general, we want the atmoz/sftp package, which runs on Intel
  # architecture. For Apple M and other ARM chips, we want to arm64 fork.
  def sftp_image_name
    if RUBY_PLATFORM =~ /arm64/
      return 'jmcombs/sftp'
    end
    return 'atmoz/sftp'
  end

  def stop_all_services
    if @dart_pid > 0
      stop_dart
    end
    stop_minio
    stop_sftp
  end

  def project_root
    File.expand_path(File.join(File.dirname(__FILE__), ".."))
  end

  def log_file_path(service_name)
    log_dir = File.join(Dir.home, "tmp", "logs")
    FileUtils.mkdir_p(log_dir)
    return File.join(log_dir, service_name + ".log")
  end

  def make_test_dirs
    base = File.join(Dir.home, "tmp")
    if base.end_with?("tmp") # So we don't delete anyone's home dir
      puts "Deleting #{base}"
    end
    FileUtils.remove_dir(base ,true)
    dirs = ["bags", "bin", "logs"]
    dirs.each do |dir|
      full_dir = File.join(base, dir)
      puts "Creating #{full_dir}"
      FileUtils.mkdir_p full_dir
    end
  end

  def show_help
    puts "To run unit and integration tests:"
    puts "    run.rb tests\n"
    puts "To run DART, SFTP and Minio for interactive testing:"
    puts "    run.rb dart\n"
    puts "To run SFTP and Minio (but not DART) for interactive testing:"
    puts "    run.rb dart\n"
    puts "This allows you to launch DART separately from VS Code in debug mode."
  end
end


if __FILE__ == $0
  runner = Runner.new
  at_exit { runner.stop_all_services }
  action = ARGV[0]
  if action == "tests"
    runner.run_tests
  elsif action == "services"
    runner.run_services
  elsif action == "dart"
    runner.run_dart
  else
    runner.show_help
  end
end
