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

let requests = { 
    links: [
        TV_SEARCH_REQ, 
        MOVIE_SEARCH_REQ,
        PC_SEARCH_REQ,
        ANIME_SEARCH_REQ,
        TV_OFFSET_SEARCH_REQ,
        BOOK_SEARCH_REQ,
        MOVIE_OFFSET_SEARCH_REQ

    ]
}
//console.log(requests.links);

for(var l = 0; l < requests.links.length; l++)
{
    console.log("\n\n\n\n\nNEXT: "+requests.links[l]);
    request(requests.links[l], { json: true }, (err, res, body) => {
        if (err) { 
            return console.log(err); 
        }
        if(body.channel.item) {
            let response_item = body.channel.item; 
        
            for(var i = 0; i < response_item.length; i++) 
            {
                let nzb = response_item[i];

                console.log(nzb.title.replace(/ /g, ""));
                console.log(nzb.link.replace(/amp;/g, ""));

                let file = fs.createWriteStream("nzbs/"+nzb.title.replace(/ /g, "")+".nzb");
            
                let request = https.get(nzb.link.replace(/amp;/g, ""), (res) => { 
                    res.pipe(file);
                    console.log("Downloaded: " + nzb.title.replace(/ /g, ""));
                }).on('error', (err) => { 

                    console.log("Error Downloading: " + err);  
                
                });
            }
        }
        else
            console.log("Response Error"); 
    });
}
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
