local Utils = require("tmux-session-switcher.utils")

local M = {}

M.config = {
	paths = { vim.fn.expand("~/code") },
}

function M.switch_or_create_session(session_name, project_path)
	if not Utils.tmux.is_running() then
		vim.notify("Not in a tmux session", vim.log.levels.ERROR)
		return
	end

	if project_path then
		Utils.tmux.create_session(session_name, project_path)
	end

	local success = Utils.tmux.switch_session(session_name)
	if not success then
		vim.notify("Failed to switch to session: " .. session_name, vim.log.levels.ERROR)
	end
end

function M.select_session()
	local active_sessions = Utils.tmux.list_sessions()
	local projects = {}

	-- Helper function to get the last part of a path
	local function get_folder_name(path)
		return path:match("([^/]+)$")
	end

	-- Gather projects from all paths
	for _, path in ipairs(M.config.paths) do
		local path_projects = Utils.git.find_projects(path)
		for _, project in ipairs(path_projects) do
			-- Use only the folder name
			local folder_name = get_folder_name(project.path)
			table.insert(projects, {
				name = folder_name,
				path = project.path,
			})
		end
	end

	local items = {}

	-- Add active sessions
	for session_name in pairs(active_sessions) do
		table.insert(items, {
			name = session_name,
			type = "active",
		})
	end

	-- Add projects that don't have active sessions
	for _, project in ipairs(projects) do
		if not active_sessions[project.name] then
			table.insert(items, {
				name = project.name,
				type = "project",
				path = project.path,
			})
		end
	end

	table.sort(items, Utils.ui.sort_sessions)

	vim.ui.select(items, {
		prompt = "Select tmux session:",
		format_item = Utils.ui.format_session,
	}, function(selected)
		if selected then
			M.switch_or_create_session(selected.name, selected.path)
		end
	end)
end

function M.setup(opts)
	opts = opts or {}

	-- Handle both string and table input for code_path/paths
	if opts.code_path then
		if type(opts.code_path) == "string" then
			opts.paths = { opts.code_path }
		elseif type(opts.code_path) == "table" then
			opts.paths = opts.code_path
		end
		opts.code_path = nil
	end

	M.config = vim.tbl_deep_extend("force", M.config, opts)

	vim.api.nvim_create_user_command("TmuxSelect", function()
		M.select_session()
	end, {})
end

return M
