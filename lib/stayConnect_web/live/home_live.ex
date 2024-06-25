defmodule StayConnectWeb.HomeLive do
  require Logger
  alias StayConnect.{Vote, Release}
  alias StayConnectWeb.{ReleaseListComponent}
  use StayConnectWeb, :live_view

  def mount(_params, _session, socket) do
    socket =
      socket
      |> assign(:weekly, Release.list_weekly())
      |> assign(:daily, Release.list_today())

    {:ok, socket}
  end

  def handle_event("upvote", %{"id" => release_id}, socket) do
    user = socket.assigns.current_user

    case Vote.upvote_release(user.id, release_id) do
      {:ok, _vote} ->
        {:noreply, socket}

      {:error, changeset} ->
        Logger.error("error upvote")
        {:noreply, socket}
    end
  end

  def handle_event("downvote", %{"id" => release_id}, socket) do
    user = socket.assigns.current_user

    case Vote.downvote_release(user.id, release_id) do
      {:ok, _vote} ->
        {:noreply, socket}

      {:error, _changeset} ->
        Logger.error("error downvote")
        {:noreply, socket}
    end
  end

  # def assign_daily(socket) do
  #   Logger.info("Socket: #{inspect(socket.assigns.daily)}")
  #   socket |> assign(socket, :daily)
  # end
end
