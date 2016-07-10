I have found a bug!
-------------------

Awesome, but before you [report it to us](issues/new), make sure to [check whether this has already been reported](issues?q=is%3Aissue).
If not, before reporting the issue you'll need to gather some information by following these instructions:

1. Make sure you are using the latest version of the application:

  ```bash
  git pull
  rm -r "/Applications/Black Screen"*
  npm run pack
  ```
2. If the bug is still present, [open an issue](issues/new).
3. Write steps to reproduce the bug.
4. Take some screenshots.
5. Gather debug logs.

 5.1. Open developer tools (View -> Toggle Developer Tools).

 5.2. Find Console.

 5.3. Copy the output and paste it into the issue.

I have some important changes!
------------------------------

1. [Clone the repo](https://help.github.com/articles/importing-a-git-repository-using-the-command-line/).
2. [Create a separate branch](https://github.com/Kunena/Kunena-Forum/wiki/Create-a-new-branch-with-git-and-manage-branches) (to prevent unrelated updates).
3. Apply your changes.
4. [Create a pull request](https://help.github.com/articles/creating-a-pull-request/).
5. Describe what has been done.

Test
----

* Install [selenium-standalone](https://github.com/vvo/selenium-standalone)
* `selenium-standalone start`
* `npm run test`
