defmodule StayConnectWeb.HelloController do
  use StayConnectWeb, :controller

  def index(conn, _param) do
    render(conn, :index)
  end
end
