#!/bin/bash

for i in app/**/*.js
do
  if ! grep -q Copyright $i
  then
    cat LICENSE_HEADER $i >$i.new && mv $i.new $i
  fi
done