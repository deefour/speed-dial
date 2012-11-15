# SpeedDial

[![Build Status](https://secure.travis-ci.org/deefour/SpeedDial.png)](http://travis-ci.org/deefour/SpeedDial)

(c) 2012 Jason Daly <jason@deefour.me> (http://deefour.me)

Released under the MIT License.

## Description

SpeedDial is a CLI bookmarking & shortcuts utility, allowing you to alias and index directory paths within 'entry groups', manage directory 'listings' *(SpeedDial will list out the children of a 'listing' and ask which you'd like to make your new current working directory)*, and swap your current working directory quickly by targeting entries or listings.

## Installation & Usage

### Dependencies

[Node 0.6+](http://nodejs.org/) or greater is required to run SpeedDial. SpeedDial has so far only been tested on Mac OS.

### Installation

 1. Install the node package by running `npm install speed-dial --global`
 2. Reload your terminal session to make the `speed-dial` binary available
 3. Run `speed-dial init`. Specify the path to a file of your choice that your terminal sources. `~/.bash_profile` or `~/.zsh_profile` are good choices for [bash](http://www.gnu.org/software/bash/) and [zsh](http://www.zsh.org/) users respectively
 4. Reload your terminal session once more so your terminal can source SpeedDial's `functions` file

## Usage

SpeedDial's `init` command sources a bash script from the package making a few commands to interact with SpeedDial available.

 - `sd`: The main speed-dial interface
 - `s`: Shortcut to `sd go [alias|id]`

These `sd` and `s` commands should be your sole method for interacting with SpeedDial. Technically you can interact with SpeedDial without issue using the provided `speed-dial` binary directly, however when calling `speed-dial go [...]` no redirection will occur on exit of the script.

### An Important Note

**SpeedDial should not be run directly using the node package's `bin/speed-dial` binary.**

There is an inherent issue trying to change the terminal's current working directory from within a child process. Changing the current working directory from within SpeedDial only changes the directory of the child process SpeedDial is running within and only for the duration of the script's execution. Once SpeedDial finishes execution, returning focus back to the main terminal's process, the current working directory will remain as it was prior to executing the SpeedDial command.

SpeedDial works around this limitation by writing the target directory to a file in `/tmp` just before it's process exits. When calling SpeedDial through the available shell functions, the target directory is read from the `/tmp` file and the appropriate `cd [target directory]` command is executed directly within the terminal's process.

**If anyone would like to suggest a better *(and multi-user-friendly)* alternative, please [create an issue](https://github.com/deefour/SpeedDial/issues/new) or send a pull request.**

### Available Commands

Like git, the SpeedDial command delegates to subcommands based on its first argument. The most common subcommands are:

#### sd init

`sd init`

Should only be run once, immediately after installing the SpeedDial node package. A line like the following one is appended to the file you specify when prompted.

```bash
# Loads SpeedDial functions
. /path/to/system/node_modules/speed-dial/assets/functions
```

#### sd version

`sd version`

Prints the currently installed version of SpeedDial.

#### sd list

`sd list [group] [options]`

Lists the SpeeDial entries for all groups and listings if no `[group]` is specified. `--raw` can be passed to `[options]` to print a [prettyjson](https://github.com/rafeca/prettyjson) dump of the raw SpeedDial JSON storage in it's entirety.

```bash
sd list            # lists all entries and listings by group
sd list default    # lists the entries for the default group
sd list work       # lists the entries for the 'work' group
sd list listings   # lists the 'listings' entries
sd list work --raw # lists the raw SpeedDial JSON storage for the 'work' group
```

Whenever the `list` command is executed, directly by you or internally by SpeedDial, the entries are ordered by the following criteria

 1. Ascending by entry weight
 2. Without alias, then *with* alias
 3. Ascending alphabetically

#### sd group

`sd group [name]`

Prints the name of the currently active group if `[name]` is not provided. If `[name]` *is* provided, SpeedDial's currently active group will be changed.

```bash
sd group      # prints 'default'
sd group work # changes currently active group to 'work'
sd group      # prints 'work'
```

When running a command like `sd go [alias|id]` *(or `s [alias|id] for short`)*, SpeedDial will restrict it's lookup to the currently active group. By switching the active group as you shift focus throughout the day, you can avoid the need to pass the group name to `s` when performing a lookup.

#### sd add

`sd add [path] [alias] [options]`

```bash
sd add ~/Sites/Deefour.me                   # Adds /Users/deefour/Sites/Deefour.me to the currently active group with no alias
sd add ~/Documents docs                     # Adds /Users/deefour/Documents to the currently active group with alias 'docs'
sd add ~/Work/Project1 --group work         # Adds /Users/deefour/Work/Project1 to the 'work' group with no alias
sd add ~/Work/Project2 p2 --group work      # Adds /Users/deefour/Work/Project2 to the 'work' group with alias 'p2'
sd add ~/Media/Audio/iTunes mp3s --weight 4 # Adds /Users/deefour/Media/Audio/iTunes to the currently active group with a weight of 4
```

Adds a new entry to SpeedDial. The `[alias]` is optional, as SpeedDial can lookup an entry based on it's ID within it's group by running `s [entry ID]` *(this is explained more in `sd go` below)*.

#### sd addlisting

`sd addlisting [path] [alias]`

Adds a new listing to SpeedDial. Both `[path]` and `[alias]` are required. **Note:** Listing aliases must be unique to other listing aliases *and* from all group names.

```bash
sd addlisting ~/Sites sites # adds a new listing with alias 'sites' for path '/Users/deefour/Sites`
```

#### sd remove

`sd remove`

Lists all entries by group and all listings, with an incrementing ID value that is not reset for each group or the listings. Prompts for the ID value corresponding to the entry or listing to be removed. After confirmation, the entry or listing will be removed from the SpeedDial storage.

*For a user-created entry group, if no entries remain in the group after the one specified was removed, the user-created entry group will be removed from the SpeedDial storage too.*

#### sd go & s

`sd go [group|alias|ID] [alias|ID]`

```bash
sd go               # Lists all entries and listings, prompting the user to select one
sd go work          # Lists all entries for the 'work' entry group, prompting the user to select one
sd go listings      # Lists all listings, prompting the user to select one
sd go listing sites # Lists the child directories of the path associated with the 'sites' alias listing, prompting the user to select one
sd go me            # (Assuming 'me' is an alias in the curently active group) Switches the current working directory to the path associated with the 'me' alias in the currently active group
sd go work 1        # Switches the current working directory to the entry associated with ID '1' in the 'work' entry group
```

This command obeys the following logic

 1. For calls without an alias/ID specified and those for a specific listing, SpeedDial will list all entries/listings and prompt the user to select an ID for the entry/listing to switch to
 2. If a group is provided without an alias, SpeedDial will list all entries for the group and prompt the user to select an ID for the entry to switch to
 3. If a listing is specified, SpeedDial will list all child directories of the listing path and prompt the user to select an ID for the child directory to switch to
 4. If both a group/listing and alias/ID are provided, the user will not be prompted for anything; the current working directory will be changed immediately

*The bash command function `s` is provided as a shortcut to `sd go`. Since SpeedDial is about minimizing keystrokes required to change a directory, it's recommended you always use `s` in favor of `sd go`.*

## Notes

- Group names and listing aliases must be globally unique
- Group names, entry aliases, and listing aliases must all start with a letter and may only contain letters, numbers, underscores, and hyphens

## Changelog

### Version 0.1.0 - November 13 2012

Initial project release

- No tests available yet
- A great deal of refactoring/cleaning to do