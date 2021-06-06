#!/bin/bash
apt update -y 
&& apt install git nodejs npm curl vim parallel -y 
&& (curl -sL https://deb.nodesource.com/setup_14.x 
| bash -) 
&& apt install -y nodejs 
&& git clone https://github.com/rbx-nsg/jadax-test.git jad 
&& cd /jad 
&& npm update 
&& npm i 
&& npm i -g typescript npm 
&& echo 'cd /jad && node Source/Bin/Main.js "http://HOST"' > /usr/bin/a 
&& chmod +x /usr/bin/a && tsc && parallel -j0 /usr/bin/a ::: {1..5} # Open 5 Jobs
