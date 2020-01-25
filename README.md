# Korpen
This is a the base web pages to serve information about the amateur floorball league in Gothenborg (called Korpen in Swedish). It automagically fetches results from the official page and presents them in a nicer way.
It also allows for the teams to:
* Create score boards concerning goals and assists.
* Upload vidoes of the games
* Tag timestamps in the videos in order to easier find goals, nice saves etc.

The system is designed to do as much as it can with as little data as possible. An example of this is the scoreboard/video tagging combination. If you tag a goal in a video, the player will automagically get points on the scoreboard (without having to add them somewhere else as well).

## Dependencies
The project runs NodeJS with express-handlerbars and a MySQL database in the backend. The dependencies should be rather straight-forward to setup.

### Node packages
The repository contains a package.json containing listing all necessary packages. Run ```npm install``` to set them up.

### MySQL database
1. Install MySQL on your server unless it is already there.
2. Create a new SQL user and update ```db_credentials.json``` with information about the created user.
3. Import ```db_setup.sql``` into your MySQL server. This will create the database, its tables and everything.
4. Manually add a series and the teams in it to start the sync. In the future I might add so it automatically adds the teams.
5. Unless the series table is hosted at http://korpengbg.se you might want to update the page parser in ```remote_syncer.js```. This is the hard part ;)

## Running the server
To start the server, simply run ``` node index.js ```. This will run on *port 9457*.
If you want to specify a custom port, just edit index.js at the end.

## Extra utilities
There is a tool called NodeAdmin that can be used to visualize databases and tables. A small wrapper script for this tool has been provided. In order to use it, first install nodeadmin with the command ```npm install nodeadmin```.  
Run the utility with the command ```node dbadmin.js``` and open [your local NodeAdmin](http://localhost:1338/nodeadmin). It runs on port 1338.


### Detailed description of installation
If you feel a bit confused and want some extra help to get started, here is a guide to setup everything (tested on a Debian system).

####Setup node

#### Step 1
Make sure you have Node and npm installed, for up-to-date info see [Node installation page](https://docs.npmjs.com/getting-started/installing-node).  
If you are lazy, the following should probably work out:
```
sudo apt-get update & sudo apt-get upgrade
sudo apt-get install nodejs npm node-semver
sudo npm install npm@latest -g
```
#### Step 2
When the installations are done, use ```npm install``` to setup project dependencies. This process will take around 2-10 minutes.

#### Database dependencies
The project uses a MySQL database which needs some "manual" setup.
##### Step 1
First off, install the MySQL server software using 
```
sudo apt-get update && sudo apt-get upgrade
sudo apt-get install mysql-server --fix-missing
```
During the installation process you will be prompted with a root password. This is the account we will use to setup our database. Any account with privileges to use the CREATE DATABASE, CREATE USER and CREATE TABLE privileges would be fine though.

##### Step 2
When the password has been set, create the db by runnning the following command (make sure to input the root password you selected in Step 1.
```
mysql --user=root --password=your_root_password < db_setup.sql
```

##### Step 3
Be happy! If everything goes as planned, the DB should be setup and ready to use.
