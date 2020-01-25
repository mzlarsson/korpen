#!/bin/bash

now=$(date +"%Y%m%d")
mysqldump -u korpen -p korpen > /home/nano/Documents/korpen/backups/db_$now.sql
