
require_dependency 'timelog_timer_hook_listener'

Redmine::Plugin.register :timelog_timer do
  name 'Timelog Timer plugin'
  author 'Behigh'
  description 'A simple javascript timer for Hours field in timelog form'
  version '2.0.0'
  url 'https://github.com/behigh/redmine_timelog_timer.git'
#  author_url 'http://example.com/about'
end
