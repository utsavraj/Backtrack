# Backtrack
BackTrack: A web-based collaboration tool for Scrum teams. Made for COMP3297 Software Engineering

## Requirements to host locally

* For the local hosting, you need:
   * 3 Terminal/Command Prompt windows
   * BackTrack Downloaded
   * BackTrack's Path

   * Install virtual enviroment by `pip install pipenv` or `pip install virtualenv`

* **Redis** for Real-Time Updates
* Our Project supports Python 3.x and 2.x. 
   * If their an issue with running Django like `ImportError: cannot import name 'izip_longest'`. Please add the following lines of codes to file raising the error:
    ```
    try:
        # Python 3
        from itertools import zip_longest
    except ImportError:
        # Python 2
        from itertools import izip_longest as zip_longest
    ```
* For Mac
   * HomeBrew for installing redis in Mac: `/usr/bin/ruby -e "$(curl -fsSL    https://raw.githubusercontent.com/Homebrew/install/master/install)"`


# Terminal Window: Django

* Go to Backtrack File: `~/PATH-TO-BACKTRACK/BackTrack`

## For Mac Users:

* Create Virtual Environment: `pipenv install django`

* Go to backTrack as pipenv sends you one file back: `./BackTrack/backTrack`

## For Window Users:


## For Django 
* Run the below code to install all required libraries.
   * For **Python 2**:`pip install -r requirements.txt`
   * For **Python 3**: `pip3 install -r requirements.txt`

* Start the Backtrack app: `python manage.py runserver`

# Terminal Window: React
* Go to frontend File: `~/PATH-TO-BACKTRACK/BackTrack/frotend/src`

* install node dependecies and node modules: `npm install`

* run the app: `npm start`

# Terminal Window: Redis

## For Mac Users:
* Install Redis using HomeBrew: `brew install redis`

* Start Redis server: `redis-server`

* Check if redis server is working. It should reply with `PONG` : `redis-cli ping`

* Stop Redis server: Pressing `control (^)` and `C` together

## For Window Users:
* Install Redis using official redis server website

* Click search button and type and open <i>'Run'</i> utility.

* Type: `services.msc` and hit enter. It will open all the installed apps on your computer

* Scroll down to the redis app and double click on it and then hit <i>'Start'</i>

* To stop: Double click the redis app again and click <i>'Stop'</i>.
