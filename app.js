const https    = require('https');
const http     = require('http');
const request  = require('request'); 
const fs       = require('fs');
const { exec } = require('child_process');

const TV_SEARCH_REQ           = "https://api.nzbgeek.info/api?t=tvsearch&cat=5000&limit=200&o=json&apikey=dd69847b1b992cc62ffb62217dcd3119";
const MOVIE_SEARCH_REQ        = "https://api.nzbgeek.info/api?t=movie&cat=2000&group=0&limit=200&o=json&apikey=dd69847b1b992cc62ffb62217dcd3119";
const PC_SEARCH_REQ           = "https://api.nzbgeek.info/api?t=search&cat=4000&group=0&limit=200&o=json&apikey=dd69847b1b992cc62ffb62217dcd3119";
const ANIME_SEARCH_REQ        = "https://api.nzbgeek.info/api?t=tvsearch&cat=5070&limit=200&o=json&apikey=dd69847b1b992cc62ffb62217dcd3119";
const TV_OFFSET_SEARCH_REQ    = "https://api.nzbgeek.info/api?t=tvsearch&cat=5000&limit=200&offset=200&o=json&apikey=dd69847b1b992cc62ffb62217dcd3119";
const BOOK_SEARCH_REQ         = "https://api.nzbgeek.info/api?t=book&cat=7000&group=0&limit=200&o=json&apikey=dd69847b1b992cc62ffb62217dcd3119";
const MOVIE_OFFSET_SEARCH_REQ = "https://api.nzbgeek.info/api?t=movie&cat=2000&group=0&limit=200&offset=200&o=json&apikey=dd69847b1b992cc62ffb62217dcd3119";
const CONSOLE_SEARCH_REQ      = "https://api.nzbgeek.info/api?t=search&cat=1000&group=0&limit=200&o=json&apikey=dd69847b1b992cc62ffb62217dcd3119";

const FROM_PATH = "/var/www/nZEDb/resources/ripper/nzb-ripper/nzbs/*";
const TO_PATH   = "/var/www/nZEDb/resources/imports/nzbs";

const UPDATE_TIMER = 600000; 

let requests = { 
    links: [
        TV_SEARCH_REQ, 
        MOVIE_SEARCH_REQ,
        PC_SEARCH_REQ,
        ANIME_SEARCH_REQ,
        TV_OFFSET_SEARCH_REQ,
        BOOK_SEARCH_REQ,
        MOVIE_OFFSET_SEARCH_REQ,
        CONSOLE_SEARCH_REQ

    ]
}

function setIntervalAndExecute(fn, t) { 
    fn();
    return (setInterval(fn, t));
}

//console.log(requests.links);
setIntervalAndExecute(() => {
    console.log("UPDATING: New");
    for(var l = 0; l < requests.links.length; l++)
    {
        request(requests.links[l], { json: true }, (err, res, body) => {
            if (err) 
                return console.log(err); 
            if (!body.channel.item)
                return console.log("ERROR: Response was malformed.");

            console.log("\n\n\n\n\nREQUEST: "+requests.links[l]);

            let response_item = body.channel.item; 

            for(var i = 0; i < response_item.length; i++) 
            {
                let nzb = response_item[i];

                let title = nzb.title.replace(/ /g, "");
                let link  = nzb.link.replace(/amp;/g, "");

                if(!fs.existsSync("nzbs/"+title+".nzb"))
                {
                    console.log(title);
                    console.log(link);

                    let file = fs.createWriteStream("nzbs/"+title+".nzb");

                    let request = https.get(link, (res) => { 
                        res.pipe(file);
                        console.log("Downloaded: " + title);
                    }).on('error', (err) => { 
                        console.log("Error Downloading: " + err);  
                    });
                }
                else
                {
                    console.log("SKIPPING: " + title + ".nzb");
                    continue;
                }
            } 
        });
    }

    //Copy updates to the indexer
    exec("cp " + FROM_PATH + " " + TO_PATH, (err, stdout, stderr) => { 
        if(err) { 
            console.log("ERROR: Couldn't copy shit"); 
            return; 
        }

        console.log('stdout: ${stdout}');
        console.log('stderr: ${stderr}');
    });

}, UPDATE_TIMER);


/**
exec('tar -czvf nzb-dump.tar.gz nzbs', (err, stdout, stderr) => {
    if (err) {
        // node couldn't execute the command
        console.log("ERROR: Node didnt want to tar shit up!");
        return;
    }

    // the *entire* stdout and stderr (buffered)
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
});**/
