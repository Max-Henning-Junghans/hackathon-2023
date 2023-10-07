#!/usr/bin/env bash

set -ex

THIS_DIRECTORY="$(dirname $(readlink -f $0))"

git clone --branch master --single-branch https://github.com/dji-sdk/RoboMaster-SDK.git /tmp/RoboMaster-SDK
pushd /tmp/RoboMaster-SDK
git am ${THIS_DIRECTORY}/0001-Migrate-libmedia_codec-to-latest-versions.patch

pushd lib/libmedia_codec
rm -Rf pybind11
git clone --branch stable --single-branch https://github.com/pybind/pybind11.git
pip install .
popd

pip install .
