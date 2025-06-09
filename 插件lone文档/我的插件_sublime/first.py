import sublime
import sublime_plugin


class ExampleCommand(sublime_plugin.TextCommand):
 def run(self, edit):
  self.view.insert(edit, 0, "Hello, World!")


# or super+v if you're on MacOS
# { "keys": ["ctrl+v"], "command": "tab_paste",
#    "context": [
#      { "key": "setting.translate_tabs_to_spaces", "operator": "equal", "operand": true },
#    ]
# },

class TabPasteCommand(sublime_plugin.TextCommand):
    """
    Do a paste, turning off tab to space translation temporarily.
    """
    def run(self, edit):
        self.view.settings().set("translate_tabs_to_spaces", False)
        self.view.run_command("paste")
        self.view.settings().set("translate_tabs_to_spaces", True)