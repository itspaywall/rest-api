#!/bin/bash

for i in ./app/**/*.js
do
  if ! grep -q Copyright $i
  then
    echo Applying license to $i...
    cat LICENSE_HEADER $i >$i.new && mv $i.new $i
  fi
done

for i in ./app/*.js
do
  if ! grep -q Copyright $i
  then
    echo Applying license to $i...
    cat LICENSE_HEADER $i >$i.new && mv $i.new $i
  fi
done
