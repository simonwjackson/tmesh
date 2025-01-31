local Utils = {}

-- Shell utility functions
Utils.shell = {
	execute = function(cmd)
		return os.execute(cmd)
	end,

	read_lines = function(cmd)
		local handle = io.popen(cmd)
		if not handle then
			return {}
		end

		local result = {}
		for line in handle:lines() do
			table.insert(result, line)
		end
		handle:close()

		return result
	end,
}

-- Path manipulation utilities
Utils.path = {
	normalize = function(path)
		return path:gsub("/.git/?$", ""):gsub("/.bare/?$", "")
	end,

	get_parent_dir = function(path)
		-- First trim any trailing slashes
		local cleaned_path = path:gsub("[/\\]+$", "")
		-- Then get the parent dir
		return cleaned_path:match("^(.+)[/\\][^/\\]+$")
	end,

	get_dir_name = function(path)
		return path:match("([^/]+)$")
	end,

	to_session_name = function(path, base_path, is_bare_sibling)
		if is_bare_sibling then
			local project_name = Utils.path.get_dir_name(base_path)
			local branch_name = Utils.path.get_dir_name(path)

			return string.format("%s [%s]", project_name, branch_name)
		end

		return Utils.path.get_dir_name(path)
	end,
}

-- Tmux-specific utilities
Utils.tmux = {
	is_running = function()
		return os.getenv("TMUX") ~= nil
	end,

	list_sessions = function()
		local sessions = {}
		for _, session in ipairs(Utils.shell.read_lines('tmux list-sessions -F "#{session_name}"')) do
			sessions[session] = true
		end
		return sessions
	end,

	create_session = function(name, path)
		local cmd = string.format(
			'tmux has-session -t "%s" 2>/dev/null || tmux new-session -d -s "%s" -c "%s" "$EDITOR"',
			name,
			name,
			path
		)
		return Utils.shell.execute(cmd)
	end,

	switch_session = function(name)
		local cmd = string.format('tmux switch-client -t "%s"', name)
		return Utils.shell.execute(cmd)
	end,
}

-- Git project utilities
Utils.git = {
	find_bare_siblings = function(bare_dir)
		local parent_dir = Utils.path.get_parent_dir(bare_dir)
		if not parent_dir then
			return {}
		end

		local cmd = string.format('find "%s" -mindepth 1 -maxdepth 1 -type d ! -name ".*"', parent_dir)
		local branch_dirs = Utils.shell.read_lines(cmd)

		local projects = {}
		for _, branch_dir in ipairs(branch_dirs) do
			if branch_dir ~= bare_dir then
				local session_name = Utils.path.to_session_name(branch_dir, parent_dir, true)
				table.insert(projects, {
					name = session_name,
					path = branch_dir,
				})
			end
		end

		return projects
	end,

	find_projects = function(search_path)
		local git_dirs = Utils.shell.read_lines(
			string.format('fd --type directory --hidden ".bare$|^.git$" --search-path "%s"', search_path)
		)

		local projects = {}
		for _, git_dir in ipairs(git_dirs) do
			if git_dir:match("%.bare/?$") then
				-- Handle .bare directory case
				local bare_projects = Utils.git.find_bare_siblings(git_dir)
				for _, project in ipairs(bare_projects) do
					table.insert(projects, project)
				end
			else
				-- Handle regular .git directory case
				local project_path = Utils.path.normalize(git_dir)
				local session_name = Utils.path.to_session_name(project_path, search_path, false)
				table.insert(projects, {
					name = session_name,
					path = project_path,
				})
			end
		end

		return projects
	end,
}

-- UI utilities
Utils.ui = {
	format_session = function(item)
		local prefix = item.type == "active" and "●" or "○"
		return string.format("%s %s", prefix, item.name)
	end,

	sort_sessions = function(a, b)
		if a.type == b.type then
			return a.name < b.name
		end
		return a.type == "active"
	end,
}

return Utils
