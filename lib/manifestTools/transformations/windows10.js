﻿'use strict';

var c = require('../constants'),
    fs = require('fs'),
    path = require('path'),
    windows10Utils = require('../../platformUtils/windows10Utils');

var validIconFormats = [
  'png',
  'image/png'
];

function getFormatFromIcon(icon) {
  return icon.type || (icon.src && icon.src.split('.').pop());
}

function isValidIconFormat(icon, validFormats) {
  if (!validFormats || validFormats.length === 0) {
    return true;
  }
  
  var iconFormat = getFormatFromIcon(icon);
  
  for (var i = 0; i < validFormats.length; i++) {
    if (validFormats[i].toLowerCase() === iconFormat) {
      return true;
    }
  }
  
  return false;
}

// TODO: implement convertToBase function
function convertToBase(manifestInfo, callback) {
  return callback(new Error('Not yet implemented.'));
}

function convertFromBase(manifestInfo, callback) {
  if (!manifestInfo || !manifestInfo.content) {
    return callback(new Error('Manifest content is empty or not initialized.'));
  }

  var originalManifest = manifestInfo.content;

  if (!originalManifest.start_url) {
    return callback(new Error('Start url is required.'));
  }

  var manifestTemplatePath = path.join(__dirname, '..', 'assets', 'windows10', 'appxmanifest-template.xml');

  fs.readFile(manifestTemplatePath, function (err, data) {
    if (err) {
      return callback(new Error('Could not read the manifest template' + ' (' + err.message + ')'));
    }

    var timestamp = manifestInfo.timestamp || new Date().toISOString().replace(/T/, ' ').replace(/\.[0-9]+/, ' ');

    var rawManifest = data.toString();
    rawManifest = windows10Utils.replaceManifestValues(manifestInfo, rawManifest);

    var icons = {};
    var maxResolutionIconSquare = { value : 0 , src : null };
    var maxResolutionIconWide = { value : 0 , src : null };
    if (originalManifest.icons && originalManifest.icons.length) {
      for (var i = 0; i < originalManifest.icons.length; i++) {
        var icon = originalManifest.icons[i];
        
        if (isValidIconFormat(icon, validIconFormats)) {
          var iconDimensions = icon.sizes.split('x');
          if (iconDimensions[0] === '44' && iconDimensions[1] === '44') {
            icons['44x44'] = { 'url': icon.src, 'fileName': c.WIN10_44_ICON_FILENAME };
            maxResolutionIconSquare = (maxResolutionIconSquare.value <= 44) ? { value : 44 , src : icon.src } : maxResolutionIconSquare;
          } else if (iconDimensions[0] === '50' && iconDimensions[1] === '50') {
            icons['50x50'] = { 'url': icon.src, 'fileName': c.WIN10_50_ICON_FILENAME };
            maxResolutionIconSquare = (maxResolutionIconSquare.value <= 50) ? { value : 50 , src : icon.src } : maxResolutionIconSquare;
          } else if (iconDimensions[0] === '150' && iconDimensions[1] === '150') {
            icons['150x150'] = { 'url': icon.src, 'fileName': c.WIN10_150_ICON_FILENAME };
            maxResolutionIconSquare = (maxResolutionIconSquare.value <= 150) ? { value : 150 , src : icon.src } : maxResolutionIconSquare;
          } else if (iconDimensions[0] === '310' && iconDimensions[1] === '150') {
            icons['310x150'] = { 'url': icon.src, 'fileName': c.WIN10_310x150x2_ICON_FILENAME };
            maxResolutionIconWide = (maxResolutionIconWide.value <= 310) ? { value : 310 , src : icon.src } : maxResolutionIconWide;
          } else if (iconDimensions[0] === '620' && iconDimensions[1] === '300') {
            icons['620x300'] = { 'url': icon.src, 'fileName': c.WIN10_620x300_ICON_FILENAME };
            maxResolutionIconWide = (maxResolutionIconWide.value <= 620) ? { value : 620 , src : icon.src } : maxResolutionIconWide;
          }
        }
      }
    }
    
    if(maxResolutionIconSquare.value > 0){
          if(!icons['44x44']){
            icons['44x44'] = { 'url': maxResolutionIconSquare.src, 'fileName': c.WIN10_44_ICON_FILENAME };
          }
           if(!icons['50x50']){
            icons['50x50'] = { 'url': maxResolutionIconSquare.src, 'fileName': c.WIN10_50_ICON_FILENAME };
          }
           if(!icons['150x150']){
            icons['150x150'] = { 'url': maxResolutionIconSquare.src, 'fileName': c.WIN10_150_ICON_FILENAME };
          }
    }
    if(maxResolutionIconWide.value > 0){
      if(!icons['310x150']){
        icons['310x150'] = { 'url': maxResolutionIconWide.src, 'fileName': c.WIN10_310x150x2_ICON_FILENAME };
      }
      if(!icons['620x300']){
        icons['620x300'] = { 'url': maxResolutionIconWide.src, 'fileName': c.WIN10_620x300_ICON_FILENAME };
      }
    }
    
    var manifest = {
      'rawData': rawManifest,
      'icons': icons,
    };

    var convertedManifestInfo = {
      'content': manifest,
      'format': c.WINDOWS10_MANIFEST_FORMAT,
      'timestamp' : timestamp
    };
    
    if (manifestInfo.generatedUrl) {
      convertedManifestInfo.generatedUrl = manifestInfo.generatedUrl;
    }

    if (manifestInfo.generatedFrom) {
      convertedManifestInfo.generatedFrom = manifestInfo.generatedFrom;
    }

    return callback(undefined, convertedManifestInfo);
  });
}

// TODO: implement matchFormat function
function matchFormat() { //param: manifestObj
  return false;
}

module.exports = {
  convertToBase: convertToBase,
  convertFromBase: convertFromBase,
  matchFormat: matchFormat
};
