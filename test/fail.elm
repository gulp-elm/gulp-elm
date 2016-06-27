module Fail exposing (..)

import Text (plainText)
iport Element(tag)

main = toHtml <| tag "hello" <| plainText "Test"
