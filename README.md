# <img src="frontend/public/backtrack.png" width="150" align="center" >
BackTrack: A web-based collaboration tool for Scrum teams. Made for COMP3297 Software Engineering

The short-term goals for BackTrack are to ease the creation, management and tracking of project backlogs –
both Product Backlog and Sprint Backlogs – and ensure they are visible to all concerned. Future enhancements
will provide management tools for analysis and visualization of project metrics such as velocity and burndown,
will add support for multi-team Scrum, and will add features such as individual time-tracking for developers.
DSG is aware that a fully-featured tool may form the basis for a commercial product that it could bring to
market when mature.

## Preliminary Technical Constraints and Assumptions

To save precious interview time, you may assume the following. You do not need to confirm these with your
client:
* BackTrack will be implemented in Python on Django 2.x;
* There is no constraint on choice of OS;
* Initially it will be sufficient to implement on the Django default development server. Depending on our course progress this may change for Sprint 3, but that will not affect your work in earlier iterations.
* For simplicity, you can also use the default development server with Django defaults to serve static files on the understanding that it is not a real production-strength option. As we’ll see later in the course, for production we would deploy them to a static file server or Content Delivery Network;
* BackTrack will be built with SQLite as its DBMS;
* As part of its services, BackTrack may be required to send mail to users. Again, for convenience of testing and demos, it will be sufficient to configure Django to redirect all emails to the console or to a file backend. This is not a constraint, however, and you are free to configure to use an actual mail server instead.
* You may assume you are free to use any of Django’s built-in resources and third-party applications to implement BackTrack. In fact, you are encouraged to do so. djangopackages.org and PyPI are good starting points when looking for third-party solutions – there are solutions for pretty much everything.

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
