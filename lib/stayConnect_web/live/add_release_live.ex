defmodule StayConnectWeb.AddReleaseLive do
  use StayConnectWeb, :live_view
  alias StayConnect.Release
  alias StayConnectWeb.AutoCompleteComponent
require Logger
  def mount(_params, _session, socket) do
    release_changeset = Release.changeset(%Release{})
    release_types = [Projet: "project", Single: "single", Clip: "video"]

    socket =
      socket
      |> assign(:page_title, "Ajouter une sortie")
      |> assign(:release_form, to_form(release_changeset))
      |> assign(:trigger_submit, false)
      |> assign(:release_types, release_types)

    {:ok, socket}
  end

  def handle_event("validate_release", _params, socket)do
    {:noreply, socket}
  end

  def handle_event("add_release", params, socket) do
    case Release.create(params) do
      {:ok, _release} ->
        {:noreply, assign(socket, trigger_submit: true)}

      {:error, _changeset} ->
        {:noreply, socket}
    end
  end
end
